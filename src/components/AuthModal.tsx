import { useState, type FormEvent } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { closeOutline, lockClosedOutline } from "ionicons/icons";
import { getFirebaseContext } from "../lib/firebase";

interface AuthModalProps {
  open: boolean;
  configured: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

function authMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "E-mail ou senha não conferem.";
  if (code.includes("email-already-in-use")) return "Este e-mail já tem uma conta. Tente entrar.";
  if (code.includes("weak-password")) return "Use uma senha com pelo menos 6 caracteres.";
  if (code.includes("invalid-email")) return "Confira o formato do e-mail.";
  if (code.includes("operation-not-allowed")) return "Ative o método E-mail/Senha em Authentication no Firebase.";
  if (code.includes("permission-denied")) return "Acesso negado pelas regras do Firestore. Confira firestore.rules.";
  return "Não foi possível concluir o acesso. Verifique a configuração do Firebase e tente novamente.";
}

export default function AuthModal({ open, configured, onClose, onAuthenticated }: AuthModalProps) {
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!configured) {
      setError("O Firebase não está configurado neste ambiente.");
      return;
    }

    setBusy(true);
    try {
      const context = await getFirebaseContext();
      if (!context) throw new Error("Não foi possível iniciar o Firebase.");
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      if (creatingAccount) {
        const credential = await createUserWithEmailAndPassword(context.auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(context.auth, email.trim(), password);
      }
      onAuthenticated();
      onClose();
    } catch (caught) {
      setError(authMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-close" type="button" aria-label="Fechar janela" onClick={onClose}>
          <IonIcon icon={closeOutline} />
        </button>
        <div className="auth-icon"><IonIcon icon={lockClosedOutline} /></div>
        <span className="eyebrow">Área da equipe</span>
        <h2 id="auth-title">{creatingAccount ? "Crie seu acesso" : "Bem-vindo de volta"}</h2>
        <p className="auth-copy">Entre para consultar pedidos vinculados à sua conta.</p>

        {!configured ? (
          <div className="firebase-setup-note">
            <strong>Prévia em modo de demonstração</strong>
            <p>Para ativar login e dados sincronizados, copie <code>.env.example</code> para <code>.env.local</code> com a configuração Web do Firebase, habilite E-mail/Senha e publique <code>firestore.rules</code>.</p>
            <p>Sem essa configuração, os dados da demonstração ficam somente neste navegador.</p>
            <IonButton expand="block" onClick={onClose}>Voltar à demonstração</IonButton>
          </div>
        ) : (
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
            {creatingAccount && (
              <label className="field">
                <span>Nome</span>
                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            )}
            <label className="field">
              <span>E-mail</span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="field">
              <span>Senha</span>
              <input type="password" autoComplete={creatingAccount ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <IonButton type="submit" expand="block" disabled={busy}>
              {busy ? "Aguarde…" : creatingAccount ? "Criar conta" : "Entrar"}
            </IonButton>
            <button className="text-button" type="button" onClick={() => { setCreatingAccount((value) => !value); setError(""); }}>
              {creatingAccount ? "Já tenho conta — entrar" : "Primeiro acesso? Criar conta"}
            </button>
          </form>
        )}
        <p className="auth-footnote">As regras de dados recomendadas restringem cada coleção ao usuário autenticado.</p>
      </section>
    </div>
  );
}
