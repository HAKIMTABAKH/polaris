"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default  function DemoPage  ()  {
    const {userId} = useAuth();
    const [loading, setLoading] =  useState(false);
    const [loading2, setLoading2] =  useState(false);

        const handleBockingClick = async () => {
        setLoading(true);
        await fetch('/api/demo/blocking', {
            method: 'POST',});
            setLoading(false);
        };

    const handleBackgroundClick = async () => {
        setLoading2(true);
        await fetch('/api/demo/background', {
            method: 'POST',});
            setLoading2(false);
        }

        //1 Client error - throw in the browser
        const handleClientError= () => {
            Sentry,Sentry.logger.info('User attempting to click on the client function', { userId });
            throw new Error('CLient Error: something went wrong in the browser');
        }
        //2 API error - throw in the API route
        const handleApiError = async () => {
            await fetch('/api/demo/error', {
                method: 'POST',});
        }

        //3 Inngestion error - throw during ingestion
        const handleIngestionError = async () => {
            await fetch('/api/demo/ingestion-error', {
                method: 'POST',});
        }
  return (
    <div className="p-8 space-x-4">
        <h1 className="text-2xl font-bold mb-4">Demo Page</h1>
        <Button disabled={loading} onClick={handleBockingClick} >
            {loading ? 'Loading...' : ' Blocking'}
        </Button>
        <Button disabled={loading2} onClick={handleBackgroundClick} >
            {loading2 ? 'Background...' : ' Background'}
        </Button>
        <Button variant="destructive" onClick={handleClientError}>Client Error</Button>
        <Button variant="destructive" onClick={handleApiError}>API Error</Button>
        <Button variant="destructive" onClick={handleIngestionError}>Ingestion Error</Button>
    </div>
  )
}

