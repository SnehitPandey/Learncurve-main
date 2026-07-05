import { X } from "lucide-react";
import React from "react";
import { BsInstagram, BsLinkedin, BsTwitter } from "react-icons/bs";

export default function Footer() {
	return (
		<footer
			className=" mt-20
        px-6 py-10 border-t transition-colors duration-300
        bg-background/80 text-text border-primary/40
      "
		>
			<div className="  max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-6 md:space-y-0">
				<div>
					<span 
						className="text-2xl font-bold text-primary"
						style={{ fontFamily: "'Megrim', cursive" }}
					>
						Learncurve
					</span>
					<p className="mt-2 text-text/70 max-w-xs">
						Your learning, your path — AI-crafted roadmaps and active
						communities to help you achieve your goals together.
					</p>
				</div>

				<div>
					<h4 className="uppercase text-sm font-semibold text-text/70 mb-2">
						Contact
					</h4>
					<ul className="space-y-1">
						<li>
							<a
								href="mailto:Learncurve"
								className="text-text hover:text-primary transition-colors"
							>
								Learncurvesupport@gmail.com
							</a>
						</li>
					</ul>
				</div>
			</div>

			<div className="border-t border-primary/20 mt-8 pt-6 text-center text-text/60 text-sm transition-colors">
				© {new Date().getFullYear()} Learncurve. All rights reserved.
			</div>
		</footer>
	);
}
