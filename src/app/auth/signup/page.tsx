import AuthMainTitle from "@/components/auth/auth-main-title";
import SignupForm from "../../../components/auth/signup/signup-form";

export default function Page() {
  return (
    <div className="container m-auto">
      <AuthMainTitle title="회원가입" />
      <SignupForm />
    </div>
  );
}
