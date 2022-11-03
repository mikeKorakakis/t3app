import React from "react";

interface Props {
	lines?: number;
}
export default function Skeleton({ lines = 10 }: Props) {
	return (
		<>
			{Array.from({ length: lines }).map((_, index) => (
				<tr key={index} role="status" className="animate-pulse w-full ">
					<td
						className="px-3 py-4 text-sm text-gray-500 table-cell"
						colSpan={20}
					>
						<div className="h-10 bg-gray-300 rounded-2xl dark:bg-gray-700 w-full"></div>
					</td>
				</tr>
			))}
		</>
	);
}
