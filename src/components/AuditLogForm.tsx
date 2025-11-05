import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, FileText, DollarSign, Calendar, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { fetchAuditLogs, addAuditLog, updateAuditLog } from '../api/auditLogApi';

// Inline type definition
interface AuditLog {
  id: number;
  transactionType: string;
  referenceId: string;
  date: string;
  entityId: number;
  amount: string;
}

const transactionTypes = [
  'Procurement',
  'Inventory',
  'Sales',
  'Reconciliation'
];

const AuditLogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<AuditLog, 'id'>>({
    transactionType: transactionTypes[0],
    referenceId: '',
    date: new Date().toISOString().slice(0, 10),
    entityId: 0,
    amount: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      fetchAuditLogs(token)
        .then(res => {
          const entry = res.data.results.find((e: AuditLog) => e.id === Number(id));
          if (entry) {
            const { id, ...rest } = entry;
            setForm(rest);
          }
          setLoading(false);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (isEdit) await updateAuditLog(Number(id), form, token);
      else await addAuditLog(form, token);
      navigate('/audit-logs');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-neutral-600">Loading audit log...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 bg-accent-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-accent-error-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error Loading Data</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/audit-logs')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audit Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/audit-logs')}
            variant="ghost"
            className="mb-4 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Audit Logs
          </Button>
          <h1 className="text-h2 font-bold text-neutral-900 mb-2">
            {isEdit ? 'Edit Audit Log' : 'Create New Audit Log'}
          </h1>
          <p className="text-neutral-600">
            {isEdit ? 'Update the audit log information below.' : 'Add a new audit log entry to the system.'}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Audit Log Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="transactionType" className="text-sm font-medium text-neutral-700">
                Transaction Type
              </Label>
              <select
                id="transactionType"
                value={form.transactionType}
                onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                className="input-field"
              >
                {transactionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Reference ID */}
            <div className="space-y-2">
              <Label htmlFor="referenceId" className="text-sm font-medium text-neutral-700">
                Reference ID
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  id="referenceId"
                  value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  placeholder="Enter reference ID"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-neutral-700">
                Transaction Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="date"
                  id="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Entity ID */}
            <div className="space-y-2">
              <Label htmlFor="entityId" className="text-sm font-medium text-neutral-700">
                Entity ID
              </Label>
              <input
                type="number"
                id="entityId"
                value={form.entityId}
                onChange={(e) => setForm({ ...form, entityId: Number(e.target.value) })}
                placeholder="Enter entity ID"
                className="input-field"
                min="0"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-neutral-700">
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  id="amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-neutral-200">
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={!form.referenceId || !form.amount}
              >
                {isEdit ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Audit Log
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogForm;
