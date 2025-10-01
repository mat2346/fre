import React from 'react';

interface ConnectedUser {
  clientId: number;
  user: {
    name: string;
    color?: string;
    joinedAt?: number;
  };
}

interface CollaborationIndicatorProps {
  connectedUsers: ConnectedUser[];
  isConnected: boolean;
}

const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({ 
  connectedUsers, 
  isConnected 
}) => {
  if (!isConnected) {
    return (
      <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 text-red-300 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
          Desconectado
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-300 text-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>Colaboración activa</span>
        </div>
        
        {connectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {connectedUsers.slice(0, 3).map((user) => (
                <div
                  key={user.clientId}
                  className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: user.user.color || `hsl(${user.clientId * 137.5 % 360}, 70%, 50%)`,
                    color: 'white'
                  }}
                  title={user.user.name}
                >
                  {user.user.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            <span className="text-xs text-gray-400">
              {connectedUsers.length} usuario{connectedUsers.length !== 1 ? 's' : ''}
            </span>
            
            {connectedUsers.length > 3 && (
              <span className="text-xs text-gray-500">
                +{connectedUsers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {connectedUsers.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          {connectedUsers.map(user => user.user.name).join(', ')}
        </div>
      )}
    </div>
  );
};

export default CollaborationIndicator;
