// src/layouts/DashboardLayout.tsx
"use client";
import React from 'react';
import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, count: '5', current: true },
  { name: 'Team', href: '#', icon: UsersIcon, current: false },
  { name: 'Projects', href: '#', icon: FolderIcon, count: '12', current: false },
  { name: 'Calendar', href: '#', icon: CalendarIcon, count: '20+', current: false },
  { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  { name: 'Reports', href: '#', icon: ChartPieIcon, current: false },
];

const teams = [
  { id: 1, name: 'Heroicons', href: '#', initial: 'H', current: false },
  { id: 2, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
  { id: 3, name: 'Workcation', href: '#', initial: 'W', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      <div className="flex w-64 flex-col bg-indigo-600">
        <div className="flex h-16 items-center justify-center bg-indigo-700">
          <img
            className="h-8 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=white"
            alt="Your Company"
          />
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                    'group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium'
                  )}
                >
                  <item.icon
                    className={classNames(
                      item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                      'h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                  {item.count ? (
                    <span
                      className="ml-auto w-9 min-w-max whitespace-nowrap rounded-full bg-indigo-600 px-2.5 py-0.5 text-center text-xs font-medium text-white"
                      aria-hidden="true"
                    >
                      {item.count}
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <div className="text-xs font-semibold text-indigo-200">Your teams</div>
            <ul className="mt-2 space-y-1">
              {teams.map((team) => (
                <li key={team.id}>
                  <a
                    href={team.href}
                    className={classNames(
                      team.current ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                      'group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium'
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-400 bg-indigo-500 text-xs font-medium text-white">
                      {team.initial}
                    </span>
                    <span className="truncate">{team.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto -mx-4 px-4 py-3">
            <a
              href="#"
              className="flex items-center gap-x-4 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-medium text-white"
            >
              <img
                className="h-8 w-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
              <span>Tom Cook</span>
            </a>
          </div>
        </nav>
      </div>
      <div className="flex-1 p-6 bg-gray-100">{children}</div>
    </div>
  );
};

export default DashboardLayout;
