import { StoreProvider } from "@/lib/store";
import Shell from "@/components/shell";

export default function Home() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
