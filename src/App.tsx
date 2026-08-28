import { Inbox } from "./CourierInbox";
import { DEMO_USER_ID, DEMO_USER_NAME } from "./demo-user.js";

export default function App() {
  return (
    <main>
      <header>
        <h1>Courier Inbox</h1>
        <p>
          Signed in as <strong>{DEMO_USER_NAME}</strong> <code>{DEMO_USER_ID}</code>
        </p>
      </header>

      <Inbox />

      <footer>
        <p>
          Empty? Run <code>npm run send</code> in another terminal. The message arrives
          here in real time, with no refresh.
        </p>
      </footer>
    </main>
  );
}
