import { getTeachers } from "@/lib/actions/teachers";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function TeachersPage() {
    const teachers = await getTeachers();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
                        Teachers
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Manage faculty and staff members
                    </p>
                </div>
                <TeacherForm />
            </div>

            <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
                <CardHeader>
                    <CardTitle className="text-xl">Faculty Directory</CardTitle>
                    <CardDescription>
                        A list of all registered teachers in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {teachers.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                                <span className="text-2xl">👨‍🏫</span>
                            </div>
                            <h3 className="text-lg font-medium">No teachers found</h3>
                            <p className="text-muted-foreground mt-1 mb-4">
                                Add your first teacher to get started.
                            </p>
                            <TeacherForm />
                        </div>
                    ) : (
                        <div className="rounded-md border bg-white dark:bg-zinc-950">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[80px]">Avatar</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachers.map((teacher) => (
                                        <TableRow key={teacher.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacher.full_name}`} alt={teacher.full_name} />
                                                    <AvatarFallback>{teacher.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {teacher.full_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {teacher.email}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {teacher.phone || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(teacher.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Active
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
