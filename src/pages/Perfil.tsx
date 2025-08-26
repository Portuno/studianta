import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

const getInitials = (nameOrEmail: string | null | undefined) => {
	if (!nameOrEmail) return "U";
	const value = String(nameOrEmail);
	const parts = value.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
};

type PlanTier = "free" | "basic" | "pro";
// Stripe subscription status set. Fallback to "unknown" if not present yet.
type PlanStatus =
	| "trialing"
	| "active"
	| "past_due"
	| "canceled"
	| "unpaid"
	| "incomplete"
	| "incomplete_expired"
	| "paused"
	| "unknown";

const Perfil = () => {
	const { user, session, signOut } = useAuth();
	const navigate = useNavigate();

	const fullName = (user?.user_metadata as any)?.full_name as string | undefined;
	const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
	const email = user?.email ?? "";
	const provider = user?.app_metadata?.provider ?? "email";

	const initials = useMemo(() => {
		if (fullName && fullName.length > 0) return getInitials(fullName);
		return getInitials(email);
	}, [fullName, email]);

	const [billing, setBilling] = useState<{
		tier: PlanTier;
		status: PlanStatus;
		currentPeriodEnd?: string;
		hasCustomer: boolean;
	} | null>(null);
	const [loadingBilling, setLoadingBilling] = useState(false);
	const [processingStripe, setProcessingStripe] = useState(false);

	const fetchBillingInfo = async (userId: string) => {
		setLoadingBilling(true);
		try {
			const { data, error } = await supabase
				.from("users")
				.select(
					"plan_tier, plan_status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end"
				)
				.eq("id", userId)
				.single();
			if (error) throw error;
			setBilling({
				tier: (data?.plan_tier ?? "free") as PlanTier,
				status: (data?.plan_status ?? "unknown") as PlanStatus,
				currentPeriodEnd: data?.current_period_end ?? undefined,
				hasCustomer: Boolean(data?.stripe_customer_id),
			});
		} catch (_) {
			setBilling({ tier: "free", status: "unknown", hasCustomer: false });
		} finally {
			setLoadingBilling(false);
		}
	};

	useEffect(() => {
		if (!user?.id) return;
		fetchBillingInfo(user.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	const handleSignOut = async () => {
		await signOut();
		navigate("/login", { replace: true });
	};

	const handleUpgrade = async (plan: "basic" | "pro") => {
		if (!session?.access_token) return;
		setProcessingStripe(true);
		try {
			const { data, error } = await supabase.functions.invoke(
				"stripe-create-checkout",
				{
					body: { plan },
					headers: { Authorization: `Bearer ${session.access_token}` },
				}
			);
			if (error) throw error as any;
			const url = (data as any)?.url as string | undefined;
			if (!url) throw new Error("No se recibió la URL de checkout");
			window.location.href = url;
		} catch (err) {
			alert((err as any)?.message ?? "Error al iniciar el checkout de Stripe");
		} finally {
			setProcessingStripe(false);
		}
	};

	const handleOpenPortal = async () => {
		if (!session?.access_token) return;
		setProcessingStripe(true);
		try {
			const { data, error } = await supabase.functions.invoke(
				"stripe-create-portal",
				{
					body: {},
					headers: { Authorization: `Bearer ${session.access_token}` },
				}
			);
			if (error) throw error as any;
			const url = (data as any)?.url as string | undefined;
			if (!url) throw new Error("No se recibió la URL del portal de Stripe");
			window.location.href = url;
		} catch (err) {
			alert((err as any)?.message ?? "Error al abrir el portal de Stripe");
		} finally {
			setProcessingStripe(false);
		}
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

					<div className="border-t pt-4" aria-label="Estado de cuenta" tabIndex={0}>
						<div className="flex items-center justify-between flex-wrap gap-2">
							<h2 className="text-lg font-medium">Estado de cuenta</h2>
							<span className="text-xs text-muted-foreground">
								{loadingBilling ? "Cargando..." : `Plan: ${billing?.tier ?? "free"} · Estado: ${billing?.status ?? "unknown"}`}
							</span>
						</div>
						<div className="flex items-center gap-2 mt-2">
							{billing?.tier && (
								<Badge variant="secondary" aria-label={`Plan actual: ${billing.tier}`} tabIndex={0}>
									Plan · {billing.tier}
								</Badge>
							)}
							{billing?.status && (
								<Badge variant={billing.status === "active" || billing.status === "trialing" ? "default" : "outline"} aria-label={`Estado: ${billing.status}`} tabIndex={0}>
									Estado · {billing.status}
								</Badge>
							)}
						</div>
						{billing?.currentPeriodEnd && (
							<p className="text-xs text-muted-foreground mt-1">Renueva el {new Date(billing.currentPeriodEnd).toLocaleDateString()}</p>
						)}

						<div className="flex flex-wrap items-center gap-3 mt-3">
							{(billing?.tier ?? "free") !== "basic" && (
								<Button
									variant="default"
									onClick={() => handleUpgrade("basic")}
									disabled={processingStripe || loadingBilling}
									aria-label="Cambiar a plan Basic"
								>
									Cambiar a Basic
								</Button>
							)}
							{(billing?.tier ?? "free") !== "pro" && (
								<Button
									variant="default"
									onClick={() => handleUpgrade("pro")}
									disabled={processingStripe || loadingBilling}
									aria-label="Cambiar a plan Pro"
								>
									Cambiar a Pro
								</Button>
							)}
							<Button
								variant="secondary"
								onClick={handleOpenPortal}
								disabled={processingStripe}
								aria-label="Administrar suscripción en Stripe"
							>
								Administrar en Stripe
							</Button>
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


