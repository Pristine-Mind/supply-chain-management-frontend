import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  CircularProgress,
  Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      setLogs(response.data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;
  if (logs.length === 0) return <Typography>No audit logs found.</Typography>;

  return (
    <Container sx={{ mt: 4, position: 'relative' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">Audit Logs</Typography>
        <Box>
          <Fab
            size="small"
            onClick={() => navigate('/audit-logs/new')}
            sx={{
              ml: 2,
              backgroundColor: '#ff9800',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#fb8c00',
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Box>
      </Box>
      <List>
        {logs.map(log => (
          <ListItem key={log.id} disablePadding>
            <ListItemButton
              onClick={() => navigate(`/audit-logs/${log.id}`)}
              sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}
            >
              <ListItemText
                primary={log.amount}
                secondary={`${log.date} • Ref: ${log.reference_id} • ${log.transaction_type} | Entity: ${log.entity_id}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default AuditLogList;

