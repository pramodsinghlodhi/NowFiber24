
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
import {Bot, Upload, Loader2, Camera, Check, RefreshCw, Undo2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '../ui/alert';
import {Badge} from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { returnMaterials } from '@/app/actions';

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProofOfReturnForm() {
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
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getCameraPermission = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ title: "Camera not supported", variant: "destructive" });
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        setHasCameraPermission(true);
        setStream(s);
        if (videoRef.current) {
           videoRef.current.srcObject = s;
        }
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
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreview(dataUrl);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !user) {
      toast({title: 'No image provided or user not found', variant: 'destructive'});
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const analysisResult = await returnMaterials(preview);
      setResult(analysisResult);
      toast({title: 'Analysis Complete', description: 'Successfully analyzed returned materials.'});
    } catch (error) {
      toast({title: 'Analysis Failed', description: 'Could not analyze the image.', variant: 'destructive'});
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
        <Button variant="outline" className="w-full justify-start">
          <Undo2 className="mr-2 h-4 w-4" />
          Proof of Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary" /> AI Proof of Return
          </DialogTitle>
          <DialogDescription>
            Take a photo of your remaining materials at the end of the day. The AI will identify them to update your inventory.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="camera" onValueChange={resetState}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" onClick={getCameraPermission}><Camera className="mr-2"/> Live Capture</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="mr-2"/> Upload Photo</TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
                <div className="relative h-64 w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground transition-colors mt-2">
                    {preview ? (
                        <Image src={preview} alt="Work preview" layout="fill" objectFit="contain" className="rounded-lg" />
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
                    <Image src={preview} alt="Work preview" layout="fill" objectFit="contain" className="rounded-lg" />
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
              <div>
                  <h4 className="font-semibold mb-2">Materials Identified for Return:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.materialsToReturn?.map((item: any, index: number) => (
                      <li key={index}>
                        {item.item}: <Badge variant="secondary">{item.quantity}</Badge>
                      </li>
                    ))}
                    {result.materialsToReturn?.length === 0 && (
                        <li className="text-muted-foreground">No materials identified.</li>
                    )}
                  </ul>
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
                <Bot className="mr-2 h-4 w-4" /> Analyze & Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
