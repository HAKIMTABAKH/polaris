"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default  function DemoPage  ()  {
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

  return (
    <div className="p-8 space-x-4">
        <h1 className="text-2xl font-bold mb-4">Demo Page</h1>
        <Button disabled={loading} onClick={handleBockingClick} >
            {loading ? 'Loading...' : ' Blocking'}
        </Button>
        <Button disabled={loading2} onClick={handleBackgroundClick} >
            {loading2 ? 'Background...' : ' Background'}
        </Button>
      
      
    </div>
  )
}

