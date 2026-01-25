import { SpaceXLaunch, SpaceXLaunchpad, SpaceXRocket, NextLaunchData } from '../types';

const BASE_URL = 'https://api.spacexdata.com/v4';

/**
 * Fetch the next upcoming launch
 */
export const getNextLaunch = async (): Promise<NextLaunchData> => {
  try {
    const response = await fetch(`${BASE_URL}/launches/next`);
    if (!response.ok) throw new Error('Failed to fetch next launch');
    const launchData: SpaceXLaunch = await response.json();

    // Fetch related launchpad and rocket data
    const [launchpadRes, rocketRes] = await Promise.all([
      fetch(`${BASE_URL}/launchpads/${launchData.launchpad}`),
      fetch(`${BASE_URL}/rockets/${launchData.rocket}`)
    ]);

    const launchpadData: SpaceXLaunchpad = launchpadRes.ok ? await launchpadRes.json() : null;
    const rocketData: SpaceXRocket = rocketRes.ok ? await rocketRes.json() : null;

    return {
      ...launchData,
      launchpadData,
      rocketData
    };
  } catch (error) {
    console.error('SpaceX API Error:', error);
    throw error;
  }
};

/**
 * Fetch past launches (limit to latest 10 for performance in this demo)
 */
export const getPastLaunches = async (limit = 10): Promise<SpaceXLaunch[]> => {
  try {
    const response = await fetch(`${BASE_URL}/launches/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { upcoming: false },
        options: {
          limit,
          sort: { date_utc: 'desc' },
          populate: ['rocket', 'launchpad'] // Populate to get names directly if needed
        }
      })
    });

    if (!response.ok) throw new Error('Failed to fetch past launches');
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error('SpaceX API Error:', error);
    return [];
  }
};

/**
 * Fetch upcoming launches
 */
export const getUpcomingLaunches = async (limit = 10): Promise<SpaceXLaunch[]> => {
  try {
    const response = await fetch(`${BASE_URL}/launches/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { upcoming: true },
        options: {
          limit,
          sort: { date_utc: 'asc' }, // Soonest first
          populate: ['rocket', 'launchpad']
        }
      })
    });

    if (!response.ok) throw new Error('Failed to fetch upcoming launches');
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error('SpaceX API Error:', error);
    return [];
  }
};

/**
 * Fetch all rockets
 */
export const getAllRockets = async (): Promise<SpaceXRocket[]> => {
  try {
    const response = await fetch(`${BASE_URL}/rockets`);
    if (!response.ok) throw new Error('Failed to fetch rockets');
    return await response.json();
  } catch (error) {
    console.error('SpaceX API Error:', error);
    return [];
  }
};

/**
 * Fetch all past launches for statistics (lightweight payload)
 */
export const getAllLaunchesForStats = async (): Promise<SpaceXLaunch[]> => {
  try {
    const response = await fetch(`${BASE_URL}/launches/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { upcoming: false },
        options: {
          pagination: false, // Get all
          select: ['success', 'date_utc', 'name', 'failures'] // Only needed fields
        }
      })
    });

    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error('SpaceX API Error:', error);
    return [];
  }
};
