import { ClassForm } from "@/components/classes/ClassForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClassPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Create New Class</CardTitle>
                    <CardDescription>
                        Add a new class to your institute.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClassForm />
                </CardContent>
            </Card>
        </div>
    );
}
