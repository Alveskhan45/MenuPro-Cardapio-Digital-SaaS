/* Stub do @clerk/react para o modo demo.
   No GitHub Pages nao ha Clerk (exige chave publica + backend), mas o app
   inteiro esta dentro de <ClerkProvider>. Aqui o provider vira passthrough e
   os hooks devolvem um usuario ficticio, para o resto do app rodar intacto.
   Só entra em cena quando VITE_DEMO_MODE esta ligado. */
import type { ReactNode } from "react";

type DemoUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  imageUrl: string;
};

const DEMO_USER: DemoUser = {
  id: "user_demo",
  firstName: "visitante",
  lastName: null,
  fullName: "Visitante Demo",
  primaryEmailAddress: { emailAddress: "demo@menupro.local" },
  imageUrl: "",
};

export const DEMO_BANNER =
  "Modo demo: dados de exemplo na memoria do navegador. Nada e enviado para um servidor.";

type ProviderProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

export function ClerkProvider({ children }: ProviderProps) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    isLoading: false,
    userId: DEMO_USER.id,
    sessionId: "sess_demo",
    getToken: async () => "demo-token",
  };
}

export function useUser() {
  return { isLoaded: true, isSignedIn: true, user: DEMO_USER };
}

export function useClerk() {
  return {
    signOut: async () => {},
    openUserProfile: () => {},
  };
}

export function Show({
  children,
  fallback,
  when,
}: {
  children?: ReactNode;
  fallback?: ReactNode;
  when?: unknown;
}) {
  return when ? <>{children}</> : <>{fallback}</>;
}

function DemoAuthScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mono mb-3 text-[10px] uppercase tracking-[.2em] text-accent">
          {title}
        </div>
        <h2 className="display text-3xl font-bold tracking-[-.05em]">
          Login desativado no demo
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        <p className="mt-6 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          {DEMO_BANNER}
        </p>
        <a
          href="./"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Voltar ao inicio
        </a>
      </div>
    </div>
  );
}

export function SignIn() {
  return (
    <DemoAuthScreen
      title="Bom te ver de novo"
      subtitle="No modo demo a autenticacao real fica desligada."
    />
  );
}

export function SignUp() {
  return (
    <DemoAuthScreen
      title="Crie seu espaco"
      subtitle="No modo demo nao e preciso criar conta para navegar."
    />
  );
}

export function ClerkLoaded({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
