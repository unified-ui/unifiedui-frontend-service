import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity, useRecentVisits } from '../../contexts';
import type { ExternalAppResponse } from '../../api/types';
import classes from './ExternalAppPage.module.css';

export const ExternalAppPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { trackVisit } = useRecentVisits();
  const [app, setApp] = useState<ExternalAppResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedTenant || !id) return;
    let cancelled = false;
    apiClient!.getExternalApp(selectedTenant.id, id)
      .then((data) => { if (!cancelled) setApp(data); })
      .catch(() => { if (!cancelled) navigate('/external-apps'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [apiClient, selectedTenant, id, navigate]);

  useEffect(() => {
    if (app) {
      trackVisit({
        resource_type: 'external_app',
        resource_id: app.id,
        resource_name: app.name,
      });
    }
  }, [app, trackVisit]);

  if (isLoading || !app) {
    return (
      <MainLayout noPadding>
        <Center h="100%"><Loader /></Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <iframe
        src={app.url}
        title={app.name}
        className={classes.iframe}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </MainLayout>
  );
};
