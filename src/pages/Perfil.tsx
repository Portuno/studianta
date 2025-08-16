import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const getInitials = (nameOrEmail: string | null | undefined) => {
	if (!nameOrEmail) return "U";
	const value = String(nameOrEmail);
	const parts = value.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
};

const Perfil = () => {
	const { user, signOut } = useAuth();
	const navigate = useNavigate();

	const fullName = (user?.user_metadata as any)?.full_name as string | undefined;
	const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
	const email = user?.email ?? "";
	const provider = user?.app_metadata?.provider ?? "email";

	const initials = useMemo(() => {
		if (fullName && fullName.length > 0) return getInitials(fullName);
		return getInitials(email);
	}, [fullName, email]);

	const handleSignOut = async () => {
		await signOut();
		navigate("/login", { replace: true });
	};

	if (!user) {
		return (
			<div className="min-h-[60vh] grid place-items-center text-muted-foreground">
				<p>Debes iniciar sesión para ver tu perfil.</p>
			</div>
		);
	}

	return (
		<div className="py-6 md:py-8">
			<h1 className="text-2xl font-semibold tracking-tight mb-6" aria-label="Mi Perfil" tabIndex={0}>
				Mi Perfil
			</h1>
			<Card className="max-w-2xl">
				<CardHeader className="flex flex-row items-center gap-4">
					<Avatar className="h-14 w-14">
						<AvatarImage src={avatarUrl} alt={fullName ?? email} />
						<AvatarFallback className="text-sm">{initials}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<CardTitle className="truncate">{fullName ?? "Sin nombre"}</CardTitle>
						<p className="text-sm text-muted-foreground truncate">{email}</p>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground">Proveedor</p>
							<p className="text-sm font-medium capitalize">{provider}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground">ID de usuario</p>
							<p className="text-xs break-all text-muted-foreground">{user.id}</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 pt-2">
						<Button
							variant="destructive"
							onClick={handleSignOut}
							aria-label="Cerrar sesión"
						>
							Cerrar sesión
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Perfil;


