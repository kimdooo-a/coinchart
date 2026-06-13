import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const supabase = createAdminClient();
    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        return NextResponse.json({ users });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const supabase = createAdminClient();
    try {
        const { userId } = await req.json();
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
