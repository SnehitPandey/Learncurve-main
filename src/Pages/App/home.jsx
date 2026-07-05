import React from "react";

import Rooms from "../../Components/App/Home/rooms";
import Hero from "../../Components/App/Home/hero";

const Dashboard = () => {
	return (
		<>
			<div className="flex flex-col gap-8 pb-12 overflow-x-hidden">
				<Hero />
				<Rooms />
			</div>
		</>
	);
};

export default Dashboard;
