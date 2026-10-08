import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useData } from './data';
import { TabBar, type Tab } from './components/TabBar';
import { Today } from './screens/Today';
import { Week } from './screens/Week';
import { Progress } from './screens/Progress';
import { Manage } from './screens/Manage';

export function App() {
  const { today } = useData();
  const [tab, setTab] = useState<Tab>('today');
  const [day, setDay] = useState(today);
  const [toast, setToast] = useState<string | null>(null);

  // Follow the calendar when the day rolls over, unless the user is browsing another day.
  const [prevToday, setPrevToday] = useState(today);
  if (prevToday !== today) {
    setPrevToday(today);
    if (day === prevToday) setDay(today);
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const changeTab = (t: Tab) => {
    if (t === tab && t === 'today') setDay(today);
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="glow-bg" />
      <main className="app">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {tab === 'today' && <Today day={day} setDay={setDay} />}
            {tab === 'week' && (
              <Week
                onOpenDay={(k) => {
                  setDay(k);
                  changeTab('today');
                }}
              />
            )}
            {tab === 'progress' && <Progress />}
            {tab === 'manage' && <Manage onToast={setToast} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar tab={tab} onChange={changeTab} />
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 10, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, x: '-50%' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
