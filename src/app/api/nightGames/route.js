import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const options = {
      method: "GET",
      url: "https://therundown-therundown-v1.p.rapidapi.com/sports/2/events/2025-12-1",
      params: {
        include: "scores, lines",
        affiliate_ids: "19, 23",
        offset: "0",
      },
      headers: {
        "x-rapidapi-key": process.env.RUNDOWN_API_KEY,
        "x-rapidapi-host": "therundown-therundown-v1.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    const games = response.data?.events ?? [];

    return NextResponse.json(games);
  } catch (error) {
    console.error("RapidAPI Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 }
    );
  }
}
