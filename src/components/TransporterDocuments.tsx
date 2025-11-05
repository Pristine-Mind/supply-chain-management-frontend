import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { FileText, Upload, AlertTriangle, Download, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { 
  getTransporterDocuments, 
  uploadDocument, 
  updateDocument, 
  deleteDocument, 
  type TransporterDocument,
  type CreateDocumentData
} from '../api/transporterApi';
import { format, isBefore } from 'date-fns';

type DocumentStatus = 'valid' | 'expired' | 'expiring_soon';

const DOCUMENT_TYPES = [
    { value: 'driving_license', label: 'Driving License' },
    { value: 'vehicle_registration', label: 'Vehicle Registration' },
    { value: 'vehicle_insurance', label: 'Vehicle Insurance' },
    { value: 'id_proof', label: 'ID Proof' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'other', label: 'Other' },
];

const TransporterDocuments = () => {
  const [documents, setDocuments] = useState<TransporterDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TransporterDocument | null>(null);
  
  const [formData, setFormData] = useState<Partial<CreateDocumentData>>({
    document_type: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const data = await getTransporterDocuments();
        setDocuments(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getDocumentStatus = (expiryDate: string): DocumentStatus => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (isBefore(expiry, today)) return 'expired';
    if (isBefore(expiry, thirtyDaysFromNow)) return 'expiring_soon';
    return 'valid';
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig = {
      valid: { 
        className: 'bg-green-100 text-green-800',
        text: 'Valid',
        icon: <CheckCircle className="h-4 w-4" />
      },
      expired: { 
        className: 'bg-red-100 text-red-800',
        text: 'Expired',
        icon: <XCircle className="h-4 w-4" />
      },
      expiring_soon: { 
        className: 'bg-yellow-100 text-yellow-800',
        text: 'Expiring Soon',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    };

    const config = statusConfig[status] || statusConfig.valid;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const documentData: CreateDocumentData = {
        document_type: formData.document_type || '',
        document_number: formData.document_number || '',
        document_file: file,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || new Date().toISOString().split('T')[0],
        notes: formData.notes
      };

      if (editingDoc) {
        const updatedDoc = await updateDocument({
          id: editingDoc.id,
          ...documentData
        });
        setDocuments(docs => docs.map(doc => 
          doc.id === updatedDoc.id ? updatedDoc : doc
        ));
      } else {
        const newDoc = await uploadDocument(documentData);
        setDocuments(prev => [newDoc, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      console.error('Error saving document:', err);
      setError(err.message || 'Failed to save document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (err: any) {
        console.error('Error deleting document:', err);
        setError('Failed to delete document. Please try again.');
      }
    }
  };

  const handleEdit = (doc: TransporterDocument) => {
    setEditingDoc(doc);
    setFormData({
      document_type: doc.document_type,
      document_number: doc.document_number,
      issue_date: doc.issue_date.split('T')[0],
      expiry_date: doc.expiry_date.split('T')[0],
      notes: doc.notes || ''
    });
    setFilePreview(doc.file_url || null);
    setShowUploadForm(true);
  };

  const resetForm = () => {
    setFormData({
      document_type: '',
      document_number: '',
      issue_date: '',
      expiry_date: '',
      notes: '',
    });
    setFile(null);
    setFilePreview(null);
    setEditingDoc(null);
    setShowUploadForm(false);
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.document_type_display || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, TransporterDocument[]>);

  return (
    <div className="container mx-auto p-4 space-y-6 relative">
      <Dialog open={showUploadForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingDoc ? 'Edit Document' : 'Upload New Document'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {editingDoc ? 'Update the document details below' : 'Fill in the details to upload a new document'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type *</Label>
                <select
                  id="document_type"
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document_number">Document Number *</Label>
                <Input
                  id="document_number"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleInputChange}
                  placeholder="Enter document number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  name="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add any additional notes about this document"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Document File {!editingDoc && '*'}</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                  <div className="space-y-1 text-center w-full">
                    {(filePreview || editingDoc?.file_url) ? (
                      <div className="mt-2">
                        {filePreview?.startsWith('data:image') || 
                         (editingDoc && editingDoc.file_url && editingDoc.file_url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                          <div className="relative group">
                            <img 
                              src={filePreview || editingDoc.file_url} 
                              alt="Document preview" 
                              className="mx-auto max-h-48 w-auto object-contain rounded-md"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/90 text-xs font-medium px-2 py-1 rounded">
                                {file ? 'New file selected' : 'Current document'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                            <FileText className="h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {file 
                                ? file.name 
                                : editingDoc 
                                  ? editingDoc.file_name || 'Current document' 
                                  : 'Preview not available for this file type'}
                            </p>
                          </div>
                        )}
                        <div className="mt-2 text-sm text-gray-600">
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setFilePreview(null);
                            }}
                            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none mr-3"
                          >
                            {editingDoc ? 'Change file' : 'Remove file'}
                          </button>
                          {editingDoc && !file && (
                            <a 
                              href={editingDoc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View full document
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none hover:text-indigo-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept="image/*,.pdf,.doc,.docx"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !file}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingDoc ? 'Updating...' : 'Uploading...'}
                  </>
                ) : editingDoc ? 'Update Document' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your transport documents and certificates</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowUploadForm(true);
          }} 
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse"></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a new document.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="-ml-1 mr-2 h-5 w-5" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <div key={type} className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{type}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => {
                  const status = getDocumentStatus(doc.expiry_date);
                  const docType = DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type;
                  
                  const isImage = doc.file_url && (
                    doc.file_url.match(/\.(jpeg|jpg|gif|png)$/) !== null ||
                    (doc.file_type && doc.file_type.startsWith('image/'))
                  );
                  
                  return (
                    <Card key={doc.id} className="overflow-hidden group">
                      {isImage ? (
                        <div className="relative h-40 bg-gray-100 overflow-hidden">
                          <img 
                            src={doc.file_url} 
                            alt={`${docType} preview`}
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-sm font-medium">Click to view full size</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 bg-gray-50 flex items-center justify-center">
                          <div className="text-center p-4">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              {doc.file_name || 'Document preview not available'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{docType}</CardTitle>
                            <p className="text-sm text-gray-500">{doc.document_number}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEdit(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Issued:</span>
                            <span>{format(new Date(doc.issue_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expires:</span>
                            <span className={status === 'expired' ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {doc.notes && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-gray-500 italic">Notes: {doc.notes}</p>
                            </div>
                          )}
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => handleDownload(doc.file_url, doc.file_name || `document_${doc.id}`)}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransporterDocuments;
