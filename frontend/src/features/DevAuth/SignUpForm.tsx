import { FTButton } from '@/components/FTBasicComponents';
import { useUserSignupForm } from '@/stores/control';

export const SignUpForm = () => {
  const [, setOpen] = useUserSignupForm();
  return (
    <FTButton
      onClick={() => {
        setOpen(true);
      }}
    >
      Sign Up
    </FTButton>
  );
};
