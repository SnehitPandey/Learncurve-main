import React from "react";

import Rooms from "../../Components/App/Home/rooms";
import Hero from "../../Components/App/Home/hero";

const dashboard = () => {
	return (
		<>
			<div>
				<Hero />
				<Rooms />
			</div>
		</>
	);
};

export default dashboard;
