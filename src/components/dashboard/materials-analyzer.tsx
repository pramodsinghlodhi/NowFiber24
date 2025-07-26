'use client';

import {useState, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Bot, Wrench, Upload, Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import Image from 'next/image';
import {analyzeMaterials} from '@/app/actions';
import {Task} from '@/lib/data';
import {Alert, AlertDescription, AlertTitle} from '../ui/alert';
import {Badge} from '../ui/badge';

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function MaterialsAnalyzer({task}: {task: Task}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({title: 'No file selected', description: 'Please upload an image of the materials.', variant: 'destructive'});
      return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const photoDataUri = await toDataURL(file);
      const analysisResult = await analyzeMaterials(photoDataUri);
      setResult(analysisResult);
      toast({title: 'Analysis Complete', description: 'Successfully analyzed materials photo.'});
    } catch (error) {
      toast({title: 'Analysis Failed', description: 'Could not analyze the image.', variant: 'destructive'});
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setIsLoading(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    setIsOpen(open);
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
            <Bot className="text-primary" /> AI Materials Analyzer
          </DialogTitle>
          <DialogDescription>
            Upload a photo of materials used to complete the task. The AI will identify items and quantities.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            className="relative h-64 w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors"
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

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-4">Analyzing image...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle className="font-bold">Analysis Results</AlertTitle>
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
                  <h4 className="font-semibold mb-2">Missing Items:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.missingItems?.length > 0 ? (
                      result.missingItems.map((item: string, index: number) => (
                        <li key={index} className="text-destructive">
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
          <Button onClick={handleAnalyze} disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" /> Analyze Photo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
