import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Fab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { fetchAuditLogs } from '../api/auditLogApi';

interface AuditLog {
  id: number;
  transaction_type: string;
  reference_id: string;
  date: string;
  entity_id: number;
  amount: string;
}

const AuditLogList: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'transaction_type'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      const response = await fetchAuditLogs(token);
      setLogs(response.data.results || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = logs.filter(l =>
      !q ||
      l.reference_id?.toLowerCase().includes(q) ||
      l.transaction_type?.toLowerCase().includes(q) ||
      String(l.entity_id).includes(q) ||
      String(l.amount).toLowerCase().includes(q)
    );
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
      if (sortBy === 'amount') {
        const na = Number(a.amount);
        const nb = Number(b.amount);
        return (na - nb) * dir;
      }
      // transaction_type
      return a.transaction_type.localeCompare(b.transaction_type) * dir;
    });
    return arr;
  }, [logs, query, sortBy, sortDir]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSorted.slice(start, start + rowsPerPage);
  }, [filteredSorted, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const toggleSort = (field: 'date' | 'amount' | 'transaction_type') => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const copyRef = (ref: string) => {
    navigator.clipboard?.writeText(ref).catch(() => {});
  };

  const exportCsv = () => {
    const headers = ['ID', 'Transaction Type', 'Reference ID', 'Date', 'Entity ID', 'Amount'];
    const rows = filteredSorted.map(l => [l.id, l.transaction_type, l.reference_id, l.date, l.entity_id, l.amount]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">Audit Logs</Typography>
        <div className="flex gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
            title="Refresh"
          >
            <RefreshIcon className="mr-2" style={{ fontSize: 18 }} />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="flex items-center px-4 py-2 bg-accent-success-600 text-white rounded-lg hover:bg-accent-success-700 disabled:opacity-50 transition-colors font-medium"
            title="Export CSV"
          >
            <DownloadIcon className="mr-2" style={{ fontSize: 18 }} />
            Export
          </button>
          <button
            onClick={() => navigate('/audit-logs/new')}
            className="flex items-center justify-center w-10 h-10 bg-accent-warning-600 text-white rounded-full hover:bg-accent-warning-700 transition-colors"
            title="Add audit log"
            aria-label="Add audit log"
          >
            <AddIcon style={{ fontSize: 20 }} />
          </button>
        </div>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Search by reference, type, entity, or amount"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      {error && !loading && (
        <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>
      )}

      {!loading && filteredSorted.length === 0 && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No audit logs found</Typography>
          <Typography variant="body2" color="text.secondary">Try adjusting your search or refresh.</Typography>
        </Paper>
      )}

      {!loading && filteredSorted.length > 0 && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => toggleSort('date')} sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Date {sortBy === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell onClick={() => toggleSort('transaction_type')} sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Type {sortBy === 'transaction_type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell onClick={() => toggleSort('amount')} sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((log) => (
                  <TableRow hover key={log.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{log.reference_id}</Typography>
                        <button
                          onClick={() => copyRef(log.reference_id)}
                          className="flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-caption"
                          title="Copy reference"
                        >
                          <ContentCopyIcon style={{ fontSize: 14, marginRight: 4 }} />
                          Copy
                        </button>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.transaction_type}
                        color={log.transaction_type.toLowerCase().includes('debit') ? 'error' : log.transaction_type.toLowerCase().includes('credit') ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>#{log.entity_id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>Rs. {Number(log.amount).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <button
                        onClick={() => navigate(`/audit-logs/${log.id}`)}
                        className="flex items-center px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-caption"
                        title="View details"
                      >
                        <VisibilityIcon style={{ fontSize: 14, marginRight: 4 }} />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredSorted.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      )}
    </Container>
  );
};

export default AuditLogList;

