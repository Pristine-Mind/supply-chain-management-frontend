import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box
} from '@mui/material';
import { fetchAuditLogs, addAuditLog, updateAuditLog } from '../api/auditLogApi';

// Inline type definition
interface AuditLog {
  id: number;
  transaction_type: string;
  reference_id: string;
  date: string;
  entity_id: number;
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
    transaction_type: transactionTypes[0],
    reference_id: '',
    date: new Date().toISOString().slice(0, 10),
    entity_id: 0,
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
          const entry = res.data.results.find(e => e.id === Number(id));
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

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: field === 'entity_id' ? Number(e.target.value) : e.target.value });
  };

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

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>{isEdit ? 'Edit Audit Log' : 'New Audit Log'}</Typography>
      <Box component="form" noValidate autoComplete="off" sx={{ display: 'grid', gap: 2 }}>
        <TextField
          select
          label="Transaction Type"
          value={form.transaction_type}
          onChange={handleChange('transaction_type')}
          fullWidth
        >
          {transactionTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField
          label="Reference ID"
          value={form.reference_id}
          onChange={handleChange('reference_id')}
          fullWidth
        />
        <TextField
          label="Date"
          type="date"
          value={form.date}
          onChange={handleChange('date')}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Entity ID"
          type="number"
          value={form.entity_id}
          onChange={handleChange('entity_id')}
          fullWidth
        />
        <TextField
          label="Amount"
          type="text"
          value={form.amount}
          onChange={handleChange('amount')}
          fullWidth
        />
        <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2, backgroundColor: '#ff9800'}}>
          {isEdit ? 'Save Changes' : 'Add Log'}
        </Button>
      </Box>
    </Container>
  );
};

export default AuditLogForm;
