import { useState } from 'react';
import { FlaskConical, Zap, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import EvidencePanel from './EvidencePanel';
import ConflictPanel from './ConflictPanel';
import FollowupPanel from './FollowupPanel';
import MissingDataPanel from './MissingDataPanel';
import TimelinePanel from './TimelinePanel';
import styles from './Tabs.module.css';

const TABS = [
  { id: 'evidence',  label: 'Kanıtlar',   icon: <FlaskConical size={13} /> },
  { id: 'conflicts', label: 'Çelişkiler',  icon: <Zap size={13} /> },
  { id: 'followups', label: 'Takip',       icon: <RefreshCw size={13} /> },
  { id: 'missing',   label: 'Eksik',       icon: <AlertCircle size={13} /> },
  { id: 'timeline',  label: 'Zaman',       icon: <Calendar size={13} /> },
];

export default function TabbedPanel({ data }) {
  const [active, setActive] = useState('evidence');

  return (
    <div className={styles.card}>
      <div className={styles.tabBar}>
        {TABS.map(t => {
          const count =
            t.id === 'evidence'  ? data.evidence?.length :
            t.id === 'conflicts' ? data.conflicts?.length :
            t.id === 'followups' ? data.followups?.length :
            t.id === 'missing'   ? data.missingData?.length :
            t.id === 'timeline'  ? data.timeline?.length : null;

          return (
            <button
              key={t.id}
              className={`${styles.tab} ${active === t.id ? styles.active : ''}`}
              onClick={() => setActive(t.id)}
            >
              {t.icon}
              {t.label}
              {count != null && count > 0 && (
                <span className={`${styles.count} ${
                  t.id === 'conflicts' && count > 0 ? styles.countWarning :
                  t.id === 'missing' && count > 0 ? styles.countWarning : ''
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.pane}>
        {active === 'evidence'  && <EvidencePanel evidence={data.evidence} />}
        {active === 'conflicts' && <ConflictPanel conflicts={data.conflicts} />}
        {active === 'followups' && <FollowupPanel followups={data.followups} />}
        {active === 'missing'   && <MissingDataPanel missingData={data.missingData} />}
        {active === 'timeline'  && <TimelinePanel timeline={data.timeline} />}
      </div>
    </div>
  );
}
