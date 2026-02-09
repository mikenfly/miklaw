import { useUIStore } from '../../stores/uiStore';
import ConversationList from './ConversationList';
import NewConversationButton from './NewConversationButton';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${!sidebarOpen && isMobile ? 'sidebar--closed' : ''}`}>
        <div className="sidebar__header">
          <h3>Conversations</h3>
          {isMobile && (
            <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
              &#x2715;
            </button>
          )}
        </div>
        <div className="sidebar__body">
          <ConversationList />
        </div>
        <div className="sidebar__footer">
          <NewConversationButton />
          <Link to="/settings" className="sidebar__settings-link">
            Parametres
          </Link>
        </div>
      </aside>
    </>
  );
}
