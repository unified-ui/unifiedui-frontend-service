import { lazy } from 'react';
import { IconChecklist } from '@tabler/icons-react';
import {
  CUSTOM_EXTENSION_API_VERSION,
  defineCustomExtension,
} from '@unified-ui/custom-api';

const TodoPage = lazy(() => import('./pages/TodoPage').then(module => ({ default: module.TodoPage })));

export default defineCustomExtension({
  apiVersion: CUSTOM_EXTENSION_API_VERSION,
  id: 'test',
  routes: [
    {
      id: 'test-todos-route',
      path: '/custom/test',
      component: TodoPage,
    },
  ],
  sidebarItems: [
    {
      id: 'test-todos-sidebar',
      path: '/custom/test',
      labelKey: 'sidebarLabel',
      icon: IconChecklist,
      section: 'primary',
      order: 100,
    },
  ],
  translations: {
    'en-US': {
      sidebarLabel: 'Test',
      title: 'Todo test',
      description: 'A local custom frontend component without backend interaction.',
      inputLabel: 'New task',
      inputPlaceholder: 'What needs to be done?',
      add: 'Add task',
      all: 'All',
      open: 'Open',
      completed: 'Completed',
      empty: 'No tasks in this view.',
      delete: 'Delete task',
      clearCompleted: 'Clear completed',
      remaining: '{{count}} remaining',
    },
    'de-DE': {
      sidebarLabel: 'Test',
      title: 'Todo-Test',
      description: 'Eine lokale Custom-Frontend-Komponente ohne Backend-Interaktion.',
      inputLabel: 'Neue Aufgabe',
      inputPlaceholder: 'Was muss erledigt werden?',
      add: 'Aufgabe hinzufügen',
      all: 'Alle',
      open: 'Offen',
      completed: 'Erledigt',
      empty: 'Keine Aufgaben in dieser Ansicht.',
      delete: 'Aufgabe löschen',
      clearCompleted: 'Erledigte löschen',
      remaining: '{{count}} offen',
    },
  },
});
