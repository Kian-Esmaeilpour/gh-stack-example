import { handle } from "./api.js";

// A tiny CLI shim over the route handlers so the feature is usable end to end.
export function run(argv: string[]): string {
  const [command, ...rest] = argv;

  switch (command) {
    case "list":
      return render(handle({ method: "GET", path: "/tickets" }));
    case "create":
      return render(handle({ method: "POST", path: "/tickets", body: { title: rest.join(" ") } }));
    case "show":
      return render(handle({ method: "GET", path: `/tickets/${rest[0]}` }));
    case "close":
      return render(handle({ method: "PATCH", path: `/tickets/${rest[0]}`, body: { status: "closed" } }));
    default:
      return "usage: tickets <list|create|show|close> [args]";
  }
}

function render(res: { status: number; body: unknown }): string {
  return `${res.status} ${JSON.stringify(res.body, null, 2)}`;
}
