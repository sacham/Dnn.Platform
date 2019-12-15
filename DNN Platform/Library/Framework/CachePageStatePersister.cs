﻿// 
// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.
// 
#region Usings

using System;
using System.Text;
using System.Web.Caching;
using System.Web.UI;

using DotNetNuke.Common.Utilities;
using DotNetNuke.Services.Cache;

#endregion

namespace DotNetNuke.Framework
{
    /// -----------------------------------------------------------------------------
    /// Namespace:  DotNetNuke.Framework
    /// Project:    DotNetNuke
    /// Class:      CachePageStatePersister
    /// -----------------------------------------------------------------------------
    /// <summary>
    /// CachePageStatePersister provides a cache based page state peristence mechanism
    /// </summary>
    /// -----------------------------------------------------------------------------
    public class CachePageStatePersister : PageStatePersister
    {
        private const string VIEW_STATE_CACHEKEY = "__VIEWSTATE_CACHEKEY";

        /// -----------------------------------------------------------------------------
        /// <summary>
        /// Creates the CachePageStatePersister
        /// </summary>
        /// -----------------------------------------------------------------------------
        public CachePageStatePersister(Page page) : base(page)
        {
        }

        /// -----------------------------------------------------------------------------
        /// <summary>
        /// Loads the Page State from the Cache
        /// </summary>
        /// -----------------------------------------------------------------------------
        public override void Load()
        {
            //Get the cache key from the web form data
            string key = Page.Request.Params[VIEW_STATE_CACHEKEY];

            //Abort if cache key is not available or valid
            if (string.IsNullOrEmpty(key) || !key.StartsWith("VS_"))
            {
                throw new ApplicationException("Missing valid " + VIEW_STATE_CACHEKEY);
            }
            var state = DataCache.GetCache<Pair>(key);
            if (state != null)
            {
                //Set view state and control state
                ViewState = state.First;
                ControlState = state.Second;
            }
            //Remove this ViewState from the cache as it has served its purpose
            if (!Page.IsCallback)
            {
                DataCache.RemoveCache(key);
            }
        }

        /// -----------------------------------------------------------------------------
        /// <summary>
        /// Saves the Page State to the Cache
        /// </summary>
        /// -----------------------------------------------------------------------------
        public override void Save()
        {
			//No processing needed if no states available
            if (ViewState == null && ControlState == null)
            {
                return;
            }
			
            //Generate a unique cache key
            var key = new StringBuilder();
            {
                key.Append("VS_");
                key.Append(Page.Session == null ? Guid.NewGuid().ToString() : Page.Session.SessionID);
                key.Append("_");
                key.Append(DateTime.Now.Ticks.ToString());
            }
			
            //Save view state and control state separately
            var state = new Pair(ViewState, ControlState);

            //Add view state and control state to cache
            DNNCacheDependency objDependency = null;
            DataCache.SetCache(key.ToString(), state, objDependency, DateTime.Now.AddMinutes(Page.Session.Timeout), Cache.NoSlidingExpiration, CacheItemPriority.NotRemovable, null);

            //Register hidden field to store cache key in
            Page.ClientScript.RegisterHiddenField(VIEW_STATE_CACHEKEY, key.ToString());
        }
    }
}
