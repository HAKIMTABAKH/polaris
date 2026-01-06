"use client";

import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Sign } from 'crypto';
import { SignOutButton } from '@clerk/nextjs';


const Page = () => {
    const projects = useQuery(api.projects.get);

    const createProject = useMutation(api.projects.create);
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Button
                onClick={async () => {
                    await createProject({ name: "New 5" });
                }}
            >
                Create Project
            </Button>
            {projects?.map((project) => (
                <div key={project._id} className="mb-4 p-4 border rounded shadow">
                    <p>Projects list: {project.name}</p>
                    <p>Owner ID: {project.ownerId}</p>
                    </div>
            ))}
        </div>
        
    )
}
export default Page
