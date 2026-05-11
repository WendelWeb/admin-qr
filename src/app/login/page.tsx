import LoginForm from "./_form";

// We can't know on the server whether the visitor is the super_admin (no
// session yet), so we always render the form. The /api/auth/login route
// rejects non-super-admin sign-ins with DEV_DISCONNECTED when the project
// is disconnected, and LoginForm swaps to the disconnect screen on that
// response. Super admins log in normally.
export default function LoginPage() {
  return <LoginForm />;
}
