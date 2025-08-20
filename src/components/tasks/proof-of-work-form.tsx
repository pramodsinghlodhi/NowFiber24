
'use client';

import {useState, useRef, useEffect, useCallback} from 'react';
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
import {Bot, Upload, Loader2, AlertTriangle, Camera, Check, RefreshCw, SwitchCamera} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import Image from 'next/image';
import {analyzeMaterials} from '@/app/actions';
import {Task} from '@/lib/types';
import {Alert, AlertDescription, AlertTitle} from '../ui/alert';
import {Badge} from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/contexts/auth-context';

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProofOfWorkForm({task}: {task: Task}) {
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

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const getCameraPermission = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ title: "Camera not supported", variant: "destructive" });
        return;
    }

    stopStream();

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(videoInputs);

        const constraints: MediaStreamConstraints = {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
        };
        
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        setHasCameraPermission(true);
        setStream(s);
        if (videoRef.current) {
           videoRef.current.srcObject = s;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn(`Could not get location: ${err.message}`)
        );

    } catch (err) {
        console.error("Camera Error:", err);
        setHasCameraPermission(false);
        toast({ title: "Camera Access Denied", description: "Could not access the camera. Please check browser permissions.", variant: "destructive"});
    }
  }, [toast, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
        const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
        setCurrentDeviceIndex(nextIndex);
        getCameraPermission(videoDevices[nextIndex].deviceId);
    }
  };

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

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const locationStr = location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Location not available';
      
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

      stopStream();
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
      
    } catch (error) {
      toast({title: 'Analysis Failed', description: 'Could not analyze the image or save the result.', variant: 'destructive'});
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = useCallback(() => {
    setPreview(null);
    setResult(null);
    setIsLoading(false);
    setHasCameraPermission(false);
    setLocation(null);
    stopStream();
  }, [stopStream]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setIsOpen(open);
  }

  const handleRetake = () => {
    setPreview(null);
    getCameraPermission(videoDevices[currentDeviceIndex]?.deviceId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="mr-2 h-4 w-4" />
          Submit Proof
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary" /> AI Proof of Work
          </DialogTitle>
          <DialogDescription>
            Upload or capture a photo of the completed work. The AI will identify materials and your location will be logged.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="camera" onValueChange={(tab) => {
            resetState();
            if (tab === 'camera') getCameraPermission();
        }}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera"><Camera className="mr-2"/> Live Capture</TabsTrigger>
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
                                <Button onClick={() => getCameraPermission()}>Enable Camera</Button>
                            </div>
                        )
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                 <div className="flex gap-2 mt-2">
                     {preview ? (
                        <Button onClick={handleRetake} variant="outline" className="w-full"><RefreshCw className="mr-2"/>Retake Photo</Button>
                    ) : (
                        <Button onClick={handleCapture} disabled={!stream} className="w-full"><Check className="mr-2"/>Capture Photo</Button>
                    )}
                    {videoDevices.length > 1 && !preview && (
                        <Button onClick={handleSwitchCamera} variant="secondary" size="icon">
                            <SwitchCamera />
                            <span className="sr-only">Switch Camera</span>
                        </Button>
                    )}
                </div>
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
                 {preview && (
                    <Button onClick={() => setPreview(null)} variant="outline" className="w-full mt-2"><RefreshCw className="mr-2"/>Clear Photo</Button>
                )}
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
              
              {result.technicianPresent === false && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Technician Not Detected</AlertTitle>
                    <AlertDescription>
                       The AI could not detect a person in the photo. Please ensure you are in the shot for valid proof of work.
                    </AlertDescription>
                </Alert>
              )}

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
                <Alert>
                    <AlertTitle className="font-bold">Analysis Notes</AlertTitle>
                    <AlertDescription>{result.notes || 'Analysis complete.'}</AlertDescription>
              </Alert>
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
