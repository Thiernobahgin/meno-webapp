import { NavLink } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

const TABS = [
  ['/today', 'Today', 'sparkle'],
  ['/insights', 'Insights', 'chart'],
  ['/plan', 'My Plan', 'clipboard'],
  ['/doctor', 'Doctor', 'stethoscope'],
  ['/ask', 'Ask', 'chat']
];

export function BottomNav() {
  return (
    <div className="tabbar">
      {TABS.map(([to, label, icon]) => (
        <NavLink key={to} to={to} className={({ isActive }) => 'tab-btn' + (isActive ? ' active' : '')}>
          <Icon name={icon} size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
}
