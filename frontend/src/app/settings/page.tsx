import type { Metadata } from 'next';
import { SettingsClient } from '../../components/SettingsClient';

export const metadata: Metadata = {
  title: 'Settings | AegisWatch',
  description: 'Manage your profile, watched locations, and hazard alert preferences.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
