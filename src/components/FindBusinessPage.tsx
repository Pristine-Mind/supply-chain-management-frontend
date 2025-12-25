import React from 'react';
import { useParams } from 'react-router-dom';
import B2BSearch from './b2b/B2BSearch';
import B2BUserProfile from './b2b/B2BUserProfile';

const FindBusinessPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();

  return (
    <div className="min-h-screen">
      {!userId ? (
        <B2BSearch open={true} onClose={() => window.history.back()} />
      ) : (
        <B2BUserProfile />
      )}
    </div>
  );
};

export default FindBusinessPage;
