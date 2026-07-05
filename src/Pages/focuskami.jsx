import React from "react";
import Features from "../Components/landing/features";
import Herosection from "../Components/landing/herosection";
import Faq from "../Components/landing/faq";
import Plans from "../Components/landing/plans";

const landing = () => {
	return (
		<div className="mt-16">
			<Herosection />
			<Features />
			<Plans />
			<Faq />
		</div>
	);
};

export default landing;
