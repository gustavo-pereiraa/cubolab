import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/resolver.css';
import { initResolver } from './ui/resolver/index.js';
import { initTabs } from './ui/tabs.js';

initTabs();
initResolver();
