
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Report {
    id: string;
    period: string;
    generatedOn: string;
    fileUrl: string;
}

const weeklyReports: Report[] = [
    { id: '1', period: 'July 15 - July 21, 2024', generatedOn: '2024-07-22', fileUrl: '/reports/weekly-2024-07-22.xlsx' },
    { id: '2', period: 'July 8 - July 14, 2024', generatedOn: '2024-07-15', fileUrl: '/reports/weekly-2024-07-15.xlsx' },
    { id: '3', period: 'July 1 - July 7, 2024', generatedOn: '2024-07-08', fileUrl: '/reports/weekly-2024-07-08.xlsx' },
];

export default function ReportsPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setUploadedFile(event.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (uploadedFile) {
            // In a real app, you would upload the file to a server/storage here.
            toast({
                title: 'Upload Successful',
                description: `File "${uploadedFile.name}" has been uploaded.`,
            });
            setUploadedFile(null); // Clear the file after "upload"
        } else {
             toast({
                variant: 'destructive',
                title: 'No File Selected',
                description: 'Please select a file to upload.',
            });
        }
    };

    const handleDownload = (report: Report) => {
        // In a real app, this would trigger a download from the fileUrl.
        toast({
            title: 'Download Started',
            description: `Downloading report for ${report.period}.`,
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manual Report Upload</CardTitle>
                    <CardDescription>
                        Upload your call center's weekly sales data in Excel format.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">XLSX or CSV (MAX. 5MB)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>
                    {uploadedFile && (
                        <div className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                <span className="text-sm">{uploadedFile.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>Remove</Button>
                        </div>
                    )}
                    <Button onClick={handleUpload} className="w-full" disabled={!uploadedFile}>
                        <Upload className="mr-2" />
                        Upload File
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Sales Reports</CardTitle>
                    <CardDescription>
                        Auto-generated weekly sales reports for all your agents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report Period</TableHead>
                                <TableHead>Generated On</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {weeklyReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.period}</TableCell>
                                    <TableCell>{report.generatedOn}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
