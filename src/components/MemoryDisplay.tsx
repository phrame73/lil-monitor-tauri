import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ProcessInfo {
  name: string;
  memory: number;
}

interface DiskInfo {
  name: string;
  total: number;
  available: number;
  mount_point: string;
}

interface NetworkInfo {
  rx_bytes: number;
  tx_bytes: number;
}

interface SystemStats {
  free_memory: number;
  total_memory: number;
  used_memory: number;
  top_processes: ProcessInfo[];
  cpu_usage: number;
  disks: DiskInfo[];
  network: NetworkInfo;
}

// 简单的折线图组件
function Sparkline({ data, color }: { data: number[], color: string }) {
  const maxPoints = 30;
  const width = 200;
  const height = 40;
  
  if (data.length < 2) return <div style={{ width, height }} />;

  const points = data.map((val, i) => {
    const x = (i / (maxPoints - 1)) * width;
    const y = height - (Math.min(val, 100) / 100) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        points={points}
        style={{ transition: 'all 0.5s ease-in-out' }}
      />
    </svg>
  );
}

export function MemoryDisplay() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const historyLimit = 30;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await invoke<SystemStats>('get_system_stats');
        setStats(data);
        
        // 更新历史记录
        setCpuHistory(prev => [...prev.slice(-(historyLimit - 1)), data.cpu_usage]);
        const memPercent = (data.used_memory / data.total_memory) * 100;
        setMemHistory(prev => [...prev.slice(-(historyLimit - 1)), memPercent]);
      } catch (e) {
        console.error("Failed to fetch system stats:", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000); // 1s 更新一次

    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div style={{ color: 'white', padding: '40px' }}>Initializing System Monitor...</div>;

  const usedPercent = (stats.used_memory / stats.total_memory) * 100;
  const cpuPercent = stats.cpu_usage;
  const toGB = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2);
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(0);
  const toKB = (bytes: number) => (bytes / 1024).toFixed(0);

  const getBarColor = (percent: number) => {
    if (percent > 85) return 'linear-gradient(90deg, #ff1744, #ff5252)';
    if (percent > 60) return 'linear-gradient(90deg, #ff9100, #ffab40)';
    return 'linear-gradient(90deg, #00b0ff, #00e5ff)';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', color: '#eee', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      
      {/* CPU & Memory Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h3>CPU Usage</h3>
            <Sparkline data={cpuHistory} color="#00e5ff" />
          </div>
          <div style={valueStyle}>{cpuPercent.toFixed(1)}%</div>
          <div style={progressContainerStyle}>
            <div style={{ 
              ...progressBarStyle, 
              width: `${Math.min(cpuPercent, 100)}%`, 
              background: getBarColor(cpuPercent),
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
            }} />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <h3>Memory</h3>
            <Sparkline data={memHistory} color="#00e676" />
          </div>
          <div style={valueStyle}>{toGB(stats.used_memory)} / {toGB(stats.total_memory)} GB</div>
          <div style={progressContainerStyle}>
            <div style={{ 
              ...progressBarStyle, 
              width: `${usedPercent}%`, 
              background: getBarColor(usedPercent),
              boxShadow: '0 0 10px rgba(0, 230, 118, 0.3)'
            }} />
          </div>
        </div>
      </div>

      {/* Network & Disk Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <h3>Network Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#00e676' }}>⬇ Download</span>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{toKB(stats.network.rx_bytes)} KB/s</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#00b0ff' }}>⬆ Upload</span>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{toKB(stats.network.tx_bytes)} KB/s</span>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Disks</h3>
          <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
            {stats.disks.map((disk, i) => {
              const diskUsed = disk.total - disk.available;
              const diskPercent = (diskUsed / disk.total) * 100;
              return (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '4px' }}>
                    <span>{disk.mount_point} ({disk.name})</span>
                    <span style={{ color: '#aaa' }}>{toGB(disk.available)} GB free</span>
                  </div>
                  <div style={{ ...progressContainerStyle, height: '6px' }}>
                    <div style={{ 
                      ...progressBarStyle, 
                      width: `${diskPercent}%`, 
                      background: '#9e9e9e' 
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 进程列表 */}
      <div style={{ ...cardStyle, padding: '0' }}>
        <h3 style={{ padding: '20px 20px 10px 20px', margin: 0 }}>Top 10 Processes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#333', color: '#aaa', fontSize: '0.9em' }}>
              <th style={thStyle}>Process Name</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Memory</th>
            </tr>
          </thead>
          <tbody>
            {stats.top_processes.map((proc, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td style={tdStyle}>{proc.name}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{toMB(proc.memory)} MB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#222',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #333',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '10px'
};

const valueStyle: React.CSSProperties = {
  fontSize: '1.4em',
  fontWeight: 'bold',
  marginBottom: '10px',
  color: '#fff'
};

const progressContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  background: '#111',
  borderRadius: '4px',
  overflow: 'hidden'
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
};

const thStyle: React.CSSProperties = { padding: '12px 20px', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '10px 20px', fontSize: '0.95em' };