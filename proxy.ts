import { withAuth } from "next-auth/middleware";

export default withAuth(
	function middleware(req) {
		// Additional middleware logic can be added here
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
	}
);

export const config = {
	matcher: ["/dashboard/:path*"],
};
