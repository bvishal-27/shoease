import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsers, updateUserRole, deleteUser } from "@/api/adminApi";
import { formatDate } from "@/lib/format";

export default function AdminUsers() {
  const { user: me } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let ignore = false;

    getUsers()
      .then((list) => {
        if (!ignore) setUsers(list);
      })
      .catch((err) => {
        if (!ignore) toast.error(err.response?.data?.message || "Could not load users");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filter in the browser (the list is small)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleRole = async (target, role) => {
    if (role === target.role) return;

    const message =
      role === "admin"
        ? `Make ${target.name} an admin? They will be able to manage products, orders and users.`
        : `Remove admin access from ${target.name}?`;
    if (!window.confirm(message)) return;

    try {
      setBusyId(target._id);
      const updated = await updateUserRole(target._id, role);
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? { ...u, role: updated.role } : u))
      );
      toast.success(`${target.name} is now ${role === "admin" ? "an admin" : "a user"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change role");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (target) => {
    if (!window.confirm(`Delete ${target.name} (${target.email})? This cannot be undone.`)) {
      return;
    }

    try {
      setBusyId(target._id);
      await deleteUser(target._id);
      setUsers((prev) => prev.filter((u) => u._id !== target._id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} registered user{users.length === 1 ? "" : "s"}
        </p>
      </div>

      <Input
        className="mt-4 max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
      />

      <div className="mt-4 rounded-xl border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isMe = u._id === me._id;
                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.name} {isMe && <span className="text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="w-28">
                        <Select
                          value={u.role}
                          disabled={isMe || busyId === u._id}
                          onValueChange={(role) => handleRole(u, role)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={isMe || busyId === u._id}
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}