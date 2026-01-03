import "../../styles/home.css";

import ConvertButton from "../../components/ConvertButton";
import InputField from "../../components/InputField";

export default function Home() {
  return (
    <div className="homepage">
      <InputField />
      <ConvertButton />
    </div>
  );
}
