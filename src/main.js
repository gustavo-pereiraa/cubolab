import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/resolver.css';
import './styles/training.css';
import { initResolver } from './ui/resolver/index.js';
import { initTabs } from './ui/tabs.js';
import { initTraining } from './ui/training/index.js';

initTabs();
initResolver();
initTraining();
