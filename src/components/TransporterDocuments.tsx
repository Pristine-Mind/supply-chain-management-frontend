import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileText, Upload, AlertTriangle } from 'lucide-react';

const TransporterDocuments = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Vehicle Registration', type: 'Registration', expiryDate: '2023-12-31' },
    { id: 2, name: 'Insurance Policy', type: 'Insurance', expiryDate: '2023-11-15' },
  ]);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');

  const handleViewDocument = (document: { id: number; name: string; type: string; expiryDate: string }) => {
    console.log('Viewing document:', document);
  };

  const handleUploadDocument = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newDocument = {
      id: documents.length + 1,
      name: documentName,
      type: documentType,
      file: file,
      expiryDate: new Date().toISOString().split('T')[0],
    };
    console.log('Uploading document:', newDocument);  
    setDocuments([...documents, newDocument]);
    setShowUploadForm(false);
    setFile(null);
    setDocumentName('');
    setDocumentType('');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Documents</CardTitle>
          <Button onClick={() => setShowUploadForm(!showUploadForm)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {showUploadForm ? 'Cancel' : 'Upload Document'}
          </Button>
        </CardHeader>
        <CardContent>
          {showUploadForm ? (
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Input
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  required
                />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          ) : (
            <>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No Documents</h3>
                  <p className="mt-1 text-gray-500">You have not uploaded any documents yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.map((document) => (
                    <li key={document.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{document.name}</p>
                        <p className="text-sm text-gray-500">{document.type}</p>
                      </div>
                      <div className="flex items-center">
                        {new Date(document.expiryDate) < new Date() && (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <Button onClick={() => handleViewDocument(document)} size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransporterDocuments;
