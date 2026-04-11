import { sql, escapeIlike } from './neon';

// ============================================================
// MOVIES CACHE - Save/get movies from Neon cache
// ============================================================
export async function cacheMovie(movie) {
  try {
    const genres = movie.genres ? movie.genres.map((g) => g.name).join(', ') : '';
    await sql`
      INSERT INTO movies (tmdb_id, title, poster_path, backdrop_path, overview, release_date, vote_average, genres)
      VALUES (${movie.id}, ${movie.title}, ${movie.poster_path}, ${movie.backdrop_path}, ${movie.overview}, ${movie.release_date}, ${movie.vote_average}, ${genres})
      ON CONFLICT (tmdb_id) DO NOTHING
    `;
  } catch (error) {
    console.error('Cache movie error:', error);
  }
}

// ============================================================
// USER MOVIES - Personal lists (watching, finished, wishlist)
// ============================================================
export async function setMovieStatus(userId, tmdbId, status, movieData) {       
  if (movieData) await cacheMovie(movieData);

  try {
    const data = await sql`
      INSERT INTO user_movies (user_id, tmdb_id, status)
      VALUES (${userId}, ${Number(tmdbId)}, ${status})
      ON CONFLICT (user_id, tmdb_id) DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    `;
    return { data, error: null };
  } catch (error) {
    console.error('Set movie status error:', error);
    return { data: null, error };
  }
}

export async function removeMovieStatus(userId, tmdbId) {
  try {
    await sql`
      DELETE FROM user_movies WHERE user_id = ${userId} AND tmdb_id = ${Number(tmdbId)}
    `;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getUserMovies(userId, status = null) {
  try {
    let userMovies = [];
    if (status) {
      userMovies = await sql`
        SELECT * FROM user_movies 
        WHERE user_id = ${userId} AND status = ${status} 
        ORDER BY added_at DESC
      `;
    } else {
      userMovies = await sql`
        SELECT * FROM user_movies 
        WHERE user_id = ${userId} 
        ORDER BY added_at DESC
      `;
    }

    if (!userMovies?.length) return [];

    const tmdbIds = [...new Set(userMovies.map((item) => item.tmdb_id).filter(Boolean))];
    
    // Pass as array
    const movies = await sql`
      SELECT * FROM movies 
      WHERE tmdb_id = ANY (${tmdbIds}::int[])
    `;

    const movieMap = new Map((movies || []).map((m) => [m.tmdb_id, { ...m, id: m.tmdb_id }]));        
    return userMovies.map((item) => ({ ...item, movies: movieMap.get(item.tmdb_id) || { id: item.tmdb_id, title: 'Unknown Movie' } }));
  } catch (error) {
    console.error('Get user movies error:', error);
    return [];
  }
}

export async function getMovieStatus(userId, tmdbId) {
  try {
    const data = await sql`
      SELECT status FROM user_movies 
      WHERE user_id = ${userId} AND tmdb_id = ${Number(tmdbId)} 
      LIMIT 1
    `;
    return data?.[0]?.status || null;
  } catch {
    return null;
  }
}

// ============================================================
// FRIENDSHIPS
// ============================================================
export async function sendFriendRequest(requesterId, addresseeId) {
  try {
    const data = await sql`
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES (${requesterId}, ${addresseeId}, 'pending')
      RETURNING *
    `;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function acceptFriendRequest(friendshipId) {
  try {
    const data = await sql`
      UPDATE friendships SET status = 'accepted' WHERE id = ${friendshipId}
      RETURNING *
    `;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function removeFriendship(friendshipId) {
  try {
    await sql`
      DELETE FROM friendships WHERE id = ${friendshipId}
    `;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getFriendships(userId) {
  try {
    const data = await sql`
      SELECT * FROM friendships WHERE requester_id = ${userId} OR addressee_id = ${userId}
    `;
    return data || [];
  } catch (error) {
    console.error('Get friendships error:', error);
    return [];
  }
}

export async function searchUsers(query) {
  try {
    const safe = escapeIlike(query);
    if (!safe) return [];
    
    const likeVal = '%' + safe + '%';
    const data = await sql`
      SELECT id, username, full_name, avatar_url, bio, created_at FROM profiles 
      WHERE username ILIKE ${likeVal} OR full_name ILIKE ${likeVal} 
      LIMIT 20
    `;
    return data || [];
  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
}

export async function getAllUsers() {
  try {
    const data = await sql`
      SELECT id, username, full_name, avatar_url, bio, created_at FROM profiles 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    return data || [];
  } catch {
    return [];
  }
}

export async function getUserProfile(userId) {
  try {
    const data = await sql`
      SELECT id, username, full_name, avatar_url, bio, created_at FROM profiles 
      WHERE id = ${userId}
      LIMIT 1
    `;
    return data?.[0] || null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

// ============================================================
// COLLABORATIVE LISTS
// ============================================================

export async function createCollabList(userId, name, description) {
  try {
    const data = await sql`
      INSERT INTO collaborative_lists (name, description, created_by)
      VALUES (${name}, ${description}, ${userId})
      RETURNING *
    `;
    const list = data[0];
    
    // Automatically add creator as owner
    await sql`
      INSERT INTO collaborative_list_members (list_id, user_id, role)
      VALUES (${list.id}, ${userId}, 'owner')
    `;
    
    return { data: list, error: null };
  } catch (error) {
    console.error('Create collab list error:', error);
    return { data: null, error };
  }
}

export async function getUserCollabLists(userId) {
  try {
    const data = await sql`
      SELECT cl.*, clm.role 
      FROM collaborative_lists cl
      JOIN collaborative_list_members clm ON cl.id = clm.list_id
      WHERE clm.user_id = ${userId}
      ORDER BY cl.created_at DESC
    `;
    return data || [];
  } catch (error) {
    console.error('Get user collab lists error:', error);
    return [];
  }
}

export async function getCollabListMovies(listId) {
  try {
    const data = await sql`
      SELECT clm.*, m.* 
      FROM collaborative_list_movies clm
      JOIN movies m ON clm.tmdb_id = m.tmdb_id
      WHERE clm.list_id = ${listId}
      ORDER BY clm.added_at DESC
    `;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function addMovieToCollabList(listId, tmdbId, userId, movieData) {
  if (movieData) await cacheMovie(movieData);
  try {
    const data = await sql`
      INSERT INTO collaborative_list_movies (list_id, tmdb_id, added_by)
      VALUES (${listId}, ${Number(tmdbId)}, ${userId})
      RETURNING *
    `;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getCollabList(listId) {
  try {
    const data = await sql`
      SELECT * FROM collaborative_lists WHERE id = ${listId} LIMIT 1
    `;
    return data[0] || null;
  } catch (error) {
    return null;
  }
}

export async function getCollabListMembers(listId) {
  try {
    const data = await sql`
      SELECT clm.*, p.username, p.full_name, p.avatar_url 
      FROM collaborative_list_members clm
      JOIN profiles p ON clm.user_id = p.id
      WHERE clm.list_id = ${listId}
    `;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function inviteFriendToCollabList(listId, userId, role = 'editor') {
  try {
    const data = await sql`
      INSERT INTO collaborative_list_members (list_id, user_id, role)
      VALUES (${listId}, ${userId}, ${role})
      ON CONFLICT (list_id, user_id) DO UPDATE SET role = EXCLUDED.role
      RETURNING *
    `;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function removeMovieFromCollabList(listId, tmdbId) {
  try {
    await sql`
      DELETE FROM collaborative_list_movies 
      WHERE list_id = ${listId} AND tmdb_id = ${Number(tmdbId)}
    `;
    return { error: null };
  } catch (error) {
    return { error };
  }
}