
'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {Bot, Wrench, Upload, Loader2, AlertTriangle, Camera, Check, RefreshCw} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import Image from 'next/image';
import {analyzeMaterials} from '@/app/actions';
import {Task} from '@/lib/types';
import {Alert, AlertDescription, AlertTitle} from '../ui/alert';
import {Badge} from '../ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function MaterialsAnalyzer({task}: {task: Task}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const {toast} = useToast();

  useEffect(() => {
    // Stop stream when component unmounts or dialog closes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getCameraPermission = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ title: "Camera not supported", description: "Your browser does not support camera access.", variant: "destructive" });
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        setHasCameraPermission(true);
        setStream(s);
        if (videoRef.current) {
           videoRef.current.srcObject = s;
        }
        // Get location
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn(`Could not get location: ${err.message}`)
        );
      })
      .catch(err => {
         console.error(err);
         setHasCameraPermission(false);
         toast({ title: "Permission Denied", description: "Camera access was denied.", variant: "destructive"});
      });
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      toDataURL(selectedFile).then(setPreview);
      setResult(null);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Draw video frame
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // Prepare overlay text
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const locationStr = location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Location not available';
      
      // Style and draw overlay
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(0, canvas.height - 60, canvas.width, 60);
      context.font = '20px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'left';
      context.fillText(`${dateStr} ${timeStr}`, 10, canvas.height - 35);
      context.textAlign = 'right';
      context.fillText(locationStr, canvas.width - 10, canvas.height - 35);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreview(dataUrl);

      if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Turn off camera
      }
      setStream(null);
    }
  };


  const handleAnalyze = async () => {
    if (!preview || !user) {
      toast({title: 'No image provided or user not found', description: 'Please upload or capture a photo of the materials.', variant: 'destructive'});
      return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const analysisResult = await analyzeMaterials(preview, task.id);
      setResult(analysisResult);
      toast({title: 'Analysis Complete', description: 'Successfully analyzed materials photo.'});
      
      // Save to Firestore
      await addDoc(collection(db, "proofOfWork"), {
        technicianId: user.id,
        taskId: task.id,
        imageDataUri: preview,
        location: location,
        analysisResult: analysisResult,
        timestamp: new Date().toISOString()
      });
       toast({title: 'Proof of Work Saved', description: 'Your photo and analysis have been saved.'});

    } catch (error) {
      toast({title: 'Analysis Failed', description: 'Could not analyze the image or save the result.', variant: 'destructive'});
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setPreview(null);
    setResult(null);
    setIsLoading(false);
    setHasCameraPermission(false);
    setLocation(null);
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setIsOpen(open);
  }

  const handleRetake = () => {
    setPreview(null);
    getCameraPermission();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wrench className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary" /> AI Proof of Work Analyzer
          </DialogTitle>
          <DialogDescription>
            Upload or capture a photo of materials used to complete the task. The AI will identify items and quantities. Your location will be logged.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload" onValueChange={resetState}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" onClick={getCameraPermission}><Camera className="mr-2"/> Live Capture</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="mr-2"/> Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
                <div className="relative h-64 w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground transition-colors mt-2">
                    {preview ? (
                        <Image src={preview} alt="Materials preview" layout="fill" objectFit="contain" className="rounded-lg" />
                    ) : (
                         stream && hasCameraPermission ? (
                            <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted playsInline />
                        ) : (
                             <div className="text-center p-4">
                                <Camera className="mx-auto h-8 w-8 mb-2" />
                                <p className="mb-2">Camera access is required.</p>
                                <Button onClick={getCameraPermission}>Enable Camera</Button>
                            </div>
                        )
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                {preview ? (
                     <Button onClick={handleRetake} variant="outline" className="w-full mt-2"><RefreshCw className="mr-2"/>Retake Photo</Button>
                ) : (
                    <Button onClick={handleCapture} disabled={!stream} className="w-full mt-2"><Check className="mr-2"/>Capture Photo</Button>
                )}
            </TabsContent>
             <TabsContent value="upload">
                 <div
                    className="relative h-64 w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors mt-2"
                    onClick={() => fileInputRef.current?.click()}
                    >
                    {preview ? (
                    <Image src={preview} alt="Materials preview" layout="fill" objectFit="contain" className="rounded-lg" />
                    ) : (
                    <div className="text-center">
                        <Upload className="mx-auto h-8 w-8" />
                        <p>Click to upload photo</p>
                    </div>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </TabsContent>
        </Tabs>
        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-4">Analyzing image...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle className="font-bold">Analysis Notes</AlertTitle>
                <AlertDescription>{result.notes || 'Analysis complete.'}</AlertDescription>
              </Alert>
              
              {result.unauthorizedItems?.length > 0 && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Unauthorized Materials Detected!</AlertTitle>
                    <AlertDescription>
                        The following non-standard items were identified:
                         <ul className="list-disc list-inside mt-2 space-y-1">
                            {result.unauthorizedItems.map((item: any, index: number) => (
                                <li key={index}>
                                    <strong>{item.item}:</strong> {item.reason}
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Materials Used:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.materialsUsed?.map((item: any, index: number) => (
                      <li key={index}>
                        {item.item}: <Badge variant="secondary">{item.quantity}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Missing Items from Issued List:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.missingItems?.length > 0 ? (
                      result.missingItems.map((item: string, index: number) => (
                        <li key={index}>
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">None</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleAnalyze} disabled={isLoading || !preview}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" /> Analyze & Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
