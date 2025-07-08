import axios from 'axios';

export interface LedgerEntry {
  id: number;
  account_type: string;
  amount: string;
  debit: boolean;
  reference_id: string;
  date: string;
  related_entity: number;
  account_type_display: string;
}

export interface LedgerEntriesApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LedgerEntry[];
}

export async function fetchLedgerEntries(token: string, limit = 10, offset = 0): Promise<LedgerEntriesApiResponse> {
  const response = await axios.get<LedgerEntriesApiResponse>(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/ledger-entries/?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
}

export async function addLedgerEntry(
  data: Omit<LedgerEntry, 'id' | 'account_type_display'>,
  token: string
) {
  const response = await axios.post(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/ledger-entries/`,
    data,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
}
