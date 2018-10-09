'use strict';

angular
  .module('icalendarRRule')
  .factory('iCalendarRRuleService',iCalendarRRuleService);

iCalendarRRuleService.$inject = ['$http','moment'];

function iCalendarRRuleService($http,moment){
  var factory = {
      
    recurrences: ['None','Every Day','Every Week','Every Month','Every Year'],
    endsValues: ['Never','On Date','After # Occurrences'],
    weekPreffix: [ { name: 'First',value: '1' }],
    frequency: ['DAILY','WEEKLY','MONTHLY','YEARLY'],
    dayOfWeek: [
      { name: 'Sunday',value: 'SU' },
      { name: 'Monday',value: 'MO' },
      { name: 'Tuesday',value: 'TU' },
      { name: 'Wednesday',value: 'WE' },
      { name: 'Thursday',value: 'TH' },
      { name: 'Friday',value: 'FR' },
      { name: 'Saturday',value: 'SA' }
    ],
    monthOfYear: [
      { name: 'Jan',value: 1 },
      { name: 'Feb',value: 2 },
      { name: 'Mar',value: 3 },
      { name: 'Apr',value: 4 },
      { name: 'May',value: 5 },
      { name: 'Jun',value: 6 },
      { name: 'Jul',value: 7 },
      { name: 'Aug',value: 8 },
      { name: 'Sep',value: 9 },
      { name: 'Oct',value: 10 },
      { name: 'Nov',value: 11 },
      { name: 'Dec',value: 12 },
    ]    
  };
  
  factory.findReplaceShift = function(dataSource,currentShift,dateToFind){
    for(var i=0;i<dataSource.length;i++){
      var forDate = null;
      if(dataSource[i].rruleData !== undefined && dataSource[i].rruleData !== null){
        if(dataSource[i].rruleData.forDate !== null)
          forDate = new Date(dataSource[i].rruleData.forDate);
        if(forDate !== null){

          // found a deleted event
          if((dataSource[i].parentId === currentShift._id && forDate.getFullYear() === dateToFind.getFullYear() && forDate.getMonth() === dateToFind.getMonth() && forDate.getDate() === dateToFind.getDate()) && dataSource[i].isDisplay === 'no'){
            return dataSource[i];
          }
          
          // found an updated shift,event
          if(dataSource[i].parentId === currentShift._id && forDate.getFullYear() === dateToFind.getFullYear() && forDate.getMonth() === dateToFind.getMonth() && forDate.getDate() === dateToFind.getDate()){
            return dataSource[i];
          }            
        }  
      }                           
    }
    return null;
  };
  
  factory.createFollowingEvent = function(recurrenceEvent,newStartDate,newEndDate,isFirst){
    var followingEvent = angular.copy(recurrenceEvent);
    followingEvent.parentId = recurrenceEvent.id;
    if(isFirst === undefined){
      followingEvent.isFirst = false;
    }
    else{
      followingEvent.isFirst = isFirst;
    }      
    
    if(isFirst){
      followingEvent._id = recurrenceEvent._id;      
    }
    else{
      delete followingEvent._id;  
      followingEvent.recurrence = factory.recurrences[0];              
    }
    
    followingEvent.startDate = new Date(newStartDate);
    followingEvent.endDate = new Date(newEndDate);
    
    //    followingEvent.rrule = null;
    return followingEvent;
  };
  
  factory.convertFollowingEventToRootEvent = function(sourceEvent,eventToConvert){
    eventToConvert.parentId = sourceEvent.id;
    eventToConvert._id = sourceEvent.id;
    eventToConvert.recurrence = sourceEvent.recurrence;
    eventToConvert.rrule = sourceEvent.rrule;
    eventToConvert.rruleObject = sourceEvent.rruleObject;
    eventToConvert.isFirst = true;
  };
  
  factory.insertDailyRecurrenceEvents = function(sourceEvent,dataSource,yearOfCalendar,yearAmountToInsert){ 
    var followingEvents = [];
    var followingEvent = null;

    if(sourceEvent.rruleObject.freq === factory.frequency[0]){
      var startsAt = null;
      var endsAt = null;          
      var currentYear = yearOfCalendar;
      var isFirst = true;
      var replaceShift = null;
      currentYear = currentYear + yearAmountToInsert;
      sourceEvent.rruleObject.interval = parseInt(sourceEvent.rruleObject.interval);
      
      // insert first record , first record is always a recurring shift
      //      followingEvents.push(sourceEvent);

      if(startsAt === null)
        startsAt = new Date(sourceEvent.startDate);
      if(endsAt === null)
        endsAt = new Date(sourceEvent.endDate);
      
      //      startsAt.setDate(startsAt.getDate() + sourceEvent.rruleObject.interval);
      //      endsAt.setDate(endsAt.getDate() + sourceEvent.rruleObject.interval);
      
      // insert repeat to a date
      if(sourceEvent.rruleObject.until !== undefined && sourceEvent.rruleObject.until !== null){          
        var yyyyMMDD = sourceEvent.rruleObject.until;
        var endDate = moment(yyyyMMDD,'YYYYMMDD').add(24,'hours');
        
        while(startsAt <= endDate){
          
          replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
                      
          if(replaceShift === null){
            followingEvent = factory.createFollowingEvent(sourceEvent,startsAt,endsAt,isFirst);              
            followingEvents.push(followingEvent);
          }
          startsAt.setDate(startsAt.getDate() + sourceEvent.rruleObject.interval);
          endsAt.setDate(endsAt.getDate() + sourceEvent.rruleObject.interval);  
          isFirst = false;
        }            
      }
      else if(sourceEvent.rruleObject.count !== undefined){        
        var t = 1;

        var count = parseInt(sourceEvent.rruleObject.count);
        while(t <= count){
          replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
          if(replaceShift === null){
            followingEvent = factory.createFollowingEvent(sourceEvent,startsAt,endsAt,isFirst);              
            followingEvents.push(followingEvent);
          }
          
          startsAt.setDate(startsAt.getDate() + sourceEvent.rruleObject.interval);
          endsAt.setDate(endsAt.getDate() + sourceEvent.rruleObject.interval); 
          isFirst = false;
          t++;
        }          
      }
      else{
        while(startsAt.getFullYear() <= yearOfCalendar){
          replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
          if(replaceShift === null){
            followingEvent = factory.createFollowingEvent(sourceEvent,startsAt,endsAt,isFirst);              
            followingEvents.push(followingEvent);
          }
          startsAt.setDate(startsAt.getDate() + sourceEvent.rruleObject.interval);
          endsAt.setDate(endsAt.getDate() + sourceEvent.rruleObject.interval);    
          isFirst = false;
        }
        
        
        //        var beginYear = startsAt.getFullYear();
        //        var endYear = beginYear + yearAmountToInsert;
        //        for(beginYear=0;beginYear<endYear;beginYear++){
        //          replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
        //          if(replaceShift === null){
        //            followingEvent = angular.copy(sourceEvent);
        //            followingEvent.parentId = sourceEvent.id;
        //            followingEvent.startDate = new Date(startsAt);
        //            followingEvent.endDate = new Date(endsAt);
        //            followingEvent.recurrence = factory.recurrences[0];              
        //              
        //            followingEvents.push(followingEvent);
        //          }
        //          startsAt.setDate(startsAt.getDate() + sourceEvent.rruleObject.interval);
        //          endsAt.setDate(endsAt.getDate() + sourceEvent.rruleObject.interval);    
        //                    
        //          beginYear = startsAt.getFullYear();
        //        }
      }
    }
    return followingEvents;
  };
  
  factory.insertWeeklyRecurrenceEvents = function(sourceEvent,dataSource,yearOfCalendar,yearAmountToInsert){
    var followingEvents = [];
    var followingEvent = null;
    
    if(sourceEvent.rruleObject.freq === factory.frequency[1]){
      var startsAt = null;
      var endsAt = null;         
      var newStartDate = null;
      var newEndDate = null;
      var firstEventInserted = false;
      var i = 0;
      var dayIndex = 0;
      var dayAdd = 0;
      var endDate = null;
      var replaceShift = null;
      var currentYear = yearOfCalendar;
      var currentDate = new Date(sourceEvent.startsAt);
      var sunday = null;
      var dateString = '';
      currentYear = currentYear + yearAmountToInsert;
      sourceEvent.rruleObject.interval = parseInt(sourceEvent.rruleObject.interval);

      if(startsAt === null){
        startsAt = new Date(sourceEvent.startDate);        
      }
        
      if(endsAt === null)
        endsAt = new Date(sourceEvent.endDate);
             
      // insert repeat to a date
      if(sourceEvent.rruleObject.until !== undefined && sourceEvent.rruleObject.until !== null){          
        var yyyyMMDD = sourceEvent.rruleObject.until.substring(0,8);
        endDate = moment(yyyyMMDD,'YYYYMMDD').add(24,'hours');
        
        var startDate = new Date();          
        var endDateAdd = 1;
        startsAt = factory.findSundayOfWeek(startsAt);
        while(startsAt <= endDate._d){
          
          for(i=0;i<sourceEvent.rruleObject.byDay.length;i++){
            
            
            dayIndex = factory.getDayIndexOfWeek(sourceEvent.rruleObject.byDay[i]);        
            dayAdd = factory.findNextDayOfWeek(startsAt,dayIndex); 
            
            newStartDate = new Date(startsAt);
            newStartDate.setHours(startsAt.getHours(),startsAt.getMinutes(),0,0);
            newStartDate.setDate(newStartDate.getDate() + dayAdd);  
                        
            newEndDate = new Date(startsAt);
            newEndDate.setHours(endsAt.getHours(),endsAt.getMinutes(),0,0);
            newEndDate.setDate(newEndDate.getDate() + dayAdd);
            
            if(newStartDate < currentDate)
              continue;
                          
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);
               
              if(!firstEventInserted){
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
                  
              if(newStartDate < endDate._d)
                followingEvents.push(followingEvent);  
            }
          }
          
          startsAt.setDate(startsAt.getDate() + 7 * sourceEvent.rruleObject.interval);
          endsAt.setDate(endsAt.getDate() + 7 * sourceEvent.rruleObject.interval);                    
        }            
      }
      // insert repeat to a number
      else if(sourceEvent.rruleObject.count !== undefined){        
        var t = 0;
        var count = parseInt(sourceEvent.rruleObject.count);
        startsAt = factory.findSundayOfWeek(startsAt);
        while(t < count){
          
          for(i=0;i<sourceEvent.rruleObject.byDay.length;i++){
            
            if(t >= count){
              break;
            }

            //            sunday = factory.findSundayOfWeek(startsAt);
            dayIndex = factory.getDayIndexOfWeek(sourceEvent.rruleObject.byDay[i]);        
            dayAdd = factory.findNextDayOfWeek(startsAt,dayIndex);            
            
            newStartDate = new Date(startsAt);
            newStartDate.setHours(startsAt.getHours(),startsAt.getMinutes(),0,0);
            newStartDate.setDate(newStartDate.getDate() + dayAdd);  
                        
            newEndDate = new Date(startsAt);
            newEndDate.setHours(endsAt.getHours(),endsAt.getMinutes(),0,0);
            newEndDate.setDate(newEndDate.getDate() + dayAdd);            
            
            if(newStartDate < currentDate)
              continue;
                          
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);
              
              if(!firstEventInserted){
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }

              followingEvents.push(followingEvent); 
              t++;
              if(t === count){
                return followingEvents;
              }
            }    
            else{
              // has replace shift , increase t variable
              t++;
            }            
                        
          }
          
          startsAt.setDate(startsAt.getDate() + 7 * (sourceEvent.rruleObject.interval));
          endsAt.setDate(endsAt.getDate() + 7 * (sourceEvent.rruleObject.interval));          
        }          
      }
      // insert repeat
      else{
        while(true){
          
          for(i=0;i<sourceEvent.rruleObject.byDay.length;i++){
            
            sunday = factory.findSundayOfWeek(startsAt);
            dayIndex = factory.getDayIndexOfWeek(sourceEvent.rruleObject.byDay[i]);        
            dayAdd = factory.findNextDayOfWeek(sunday,dayIndex); 
            
            newStartDate = new Date(sunday);
            newStartDate.setHours(startsAt.getHours(),startsAt.getMinutes(),0,0);
            newStartDate.setDate(newStartDate.getDate() + dayAdd);  
                        
            newEndDate = new Date(sunday);
            newEndDate.setHours(endsAt.getHours(),endsAt.getMinutes(),0,0);
            newEndDate.setDate(newEndDate.getDate() + dayAdd);
            
            if(newStartDate < currentDate)
              continue;
            
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);
              
              if(!firstEventInserted){
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
                  
              followingEvents.push(followingEvent); 
            }               
          }

          startsAt.setDate(startsAt.getDate() + 7 * sourceEvent.rruleObject.interval);
          endsAt.setDate(endsAt.getDate() + 7 * sourceEvent.rruleObject.interval);  
          if(startsAt.getFullYear() > currentYear)
            break;
        }
        
        // for some situation first event is not recurrence event so update first event to be recurrence event
        followingEvents.sort(function(a,b){
          if (a.startDate < b.startDate)
            return -1;
          if (a.startDate > b.startDate)
            return 1;
          return 0;
        });
        followingEvents[0].recurrence = sourceEvent.recurrence;
        followingEvents[0].parentId = null;
        followingEvents[0]._id = sourceEvent._id;
        
        followingEvents[1].recurrence = factory.recurrences[0];
        followingEvents[1].parentId = sourceEvent._id;
      }
    }
    return followingEvents;
  };
  
  factory.insertMonthlyRecurrenceEvents = function(sourceEvent,dataSource,yearOfCalendar,yearAmountToInsert){
    var followingEvents = [];
    var followingEvent = null;
    
    if(sourceEvent.rruleObject.freq === factory.frequency[2]){
      var startsAt = null;
      var endsAt = null;       
      var newStartDate = null;
      var newEndDate = null;
      var firstEventInserted = false;
      var startMonth = 0;
      var dayAdd = 0;
      var i = 0;
      var dayIndex = 0;
      var currentDate = new Date();
      var endDate = null;
      var preffix = null;
      var day = '';
      var firstDateOfMonth = null;
      var replaceShift = null;
      
      var currentYear = yearOfCalendar;
      currentYear = currentYear + yearAmountToInsert;
      sourceEvent.rruleObject.interval = parseInt(sourceEvent.rruleObject.interval);
      
      if(startsAt === null)
        startsAt = new Date(sourceEvent.startDate);
      if(endsAt === null)
        endsAt = new Date(sourceEvent.endDate);
              
      // insert repeat to a date
      if(sourceEvent.rruleObject.until !== undefined && sourceEvent.rruleObject.until !== null){ 
        var yyyyMMDD = sourceEvent.rruleObject.until.substring(0,8);
        endDate = moment(yyyyMMDD,'YYYYMMDD').add(24,'hours');
        startMonth = startsAt.getMonth();
        
        if(sourceEvent.rruleObject.byMonthDay !== undefined && sourceEvent.rruleObject.byMonthDay !== null){

          while(startsAt <= endDate){
            //          while(startMonth <= endDate._d.getMonth()){
            
            for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
              
              newStartDate = new Date(startsAt);
              newStartDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              //              newStartDate.setMonth(startMonth);
              newEndDate = new Date(endsAt);
              newEndDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              //              newEndDate.setMonth(startMonth);
              if(newStartDate.getDate() < currentDate.getDate()){
                newStartDate.setMonth(newStartDate.getMonth() + 1);
                newEndDate.setMonth(newEndDate.getMonth() + 1);
              }
              
              replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
              if(replaceShift === null){
                followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);                
                
                if(!firstEventInserted){
                  // insert first record , first record is always a recurring shift
                  factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                  
                  firstEventInserted = true;
                }
                else{
                  followingEvent.recurrence = factory.recurrences[0];
                }
                
                /* check to make sure that date is exist , ie 31th , not all month have 31th */
                if(newStartDate.getDate().toString() === sourceEvent.rruleObject.byMonthDay[i].toString())
                  followingEvents.push(followingEvent); 
              }                
            }
            startsAt.setMonth(startsAt.getMonth() + sourceEvent.rruleObject.interval);
            //            startMonth += sourceEvent.rruleObject.interval;
          } 
        }
        else if(sourceEvent.rruleObject.byDay !== undefined && sourceEvent.rruleObject.byDay !== null){
          sourceEvent.rruleObject.byDay = sourceEvent.rruleObject.byDay.toString();
          preffix = parseInt(sourceEvent.rruleObject.byDay.substr(0,1));
          day = sourceEvent.rruleObject.byDay.substr(1,2);
          firstDateOfMonth = new Date(startsAt);
          firstDateOfMonth.setDate(1);
          if(firstDateOfMonth < startsAt)
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + 1);
          
          // loop and increase month to sourceEvent.rruleObject.until
          while(startsAt <= endDate){
            dayIndex = factory.getDayIndexOfWeek(day);
            dayAdd = factory.findNextDayOfWeek(firstDateOfMonth,dayIndex);
            
            newStartDate = new Date(startsAt);
            newStartDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newStartDate.setMonth(firstDateOfMonth.getMonth());
            newEndDate = new Date(endsAt);
            newEndDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newEndDate.setMonth(firstDateOfMonth.getMonth());
                        
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);                
              
              if(!firstEventInserted){
                // insert first record , first record is always a recurring shift
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
              
              if(newStartDate <= endDate._d)
                followingEvents.push(followingEvent); 
            }
            
            startsAt.setMonth(startsAt.getMonth() + sourceEvent.rruleObject.interval);
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + sourceEvent.rruleObject.interval);
          }           
        }
      }
      // insert repeat by number
      else if(sourceEvent.rruleObject.count !== undefined && sourceEvent.rruleObject.count !== null){          
        
        var t = 1;
        var count = parseInt(sourceEvent.rruleObject.count);
        startMonth = startsAt.getMonth();
        
        if(sourceEvent.rruleObject.byMonthDay !== undefined && sourceEvent.rruleObject.byMonthDay !== null){
          while(t <= count){
            
            for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
              
              newStartDate = new Date(startsAt);
              newStartDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              newStartDate.setMonth(startMonth);
              newEndDate = new Date(endsAt);
              newEndDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              newEndDate.setMonth(startMonth);
              if(newStartDate.getDate() < currentDate.getDate()){
                newStartDate.setMonth(newStartDate.getMonth() + 1);
                newEndDate.setMonth(newEndDate.getMonth() + 1);
              }
              
              //              console.log(factory.getWeekOfDate(newStartDate));
              
              replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
              if(replaceShift === null){
                followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);
                
                if(!firstEventInserted){
                  // insert first record , first record is always a recurring shift
                  factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                  
                  firstEventInserted = true;
                }
                else{
                  followingEvent.recurrence = factory.recurrences[0];
                }
                
                /* check to make sure that date is exist , ie 31th , not all month have 31th */
                if(newStartDate.getDate().toString() === sourceEvent.rruleObject.byMonthDay[i].toString())
                  followingEvents.push(followingEvent);  
              }                
            }

            startMonth += sourceEvent.rruleObject.interval;
            t++;
          }
        }
        else if(sourceEvent.rruleObject.byDay !== undefined && sourceEvent.rruleObject.byDay !== null){
          sourceEvent.rruleObject.byDay = sourceEvent.rruleObject.byDay.toString();
          preffix = parseInt(sourceEvent.rruleObject.byDay.substr(0,1));
          day = sourceEvent.rruleObject.byDay.substr(1,2);
          firstDateOfMonth = new Date(startsAt);
          firstDateOfMonth.setDate(1);
          if(firstDateOfMonth < startsAt)
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + 1);
          
          while(t <= count){
            dayIndex = factory.getDayIndexOfWeek(day);
            dayAdd = factory.findNextDayOfWeek(firstDateOfMonth,dayIndex);
            
            newStartDate = new Date(startsAt);
            newStartDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newStartDate.setMonth(firstDateOfMonth.getMonth());
            newEndDate = new Date(endsAt);
            newEndDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newEndDate.setMonth(firstDateOfMonth.getMonth());
            
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate);              
              
              if(!firstEventInserted){
                // insert first record , first record is always a recurring shift
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
              
              followingEvents.push(followingEvent);
            }
            
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + sourceEvent.rruleObject.interval);
            t++;
          }
          
        }
                  
      }
      // insert repeat
      else{        
        
        if(sourceEvent.rruleObject.byMonthDay !== undefined && sourceEvent.rruleObject.byMonthDay !== null){
          
          while(startsAt.getFullYear() <= currentYear){
            for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
              
              newStartDate = new Date(startsAt);
              newStartDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              newEndDate = new Date(endsAt);
              newEndDate.setDate(parseInt(sourceEvent.rruleObject.byMonthDay[i]));
              if(newStartDate.getDate() < currentDate.getDate()){
                newStartDate.setMonth(newStartDate.getMonth() + 1);
                newEndDate.setMonth(newEndDate.getMonth() + 1);
              }
              
              replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
              if(replaceShift === null){
                followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate); 
                
                if(!firstEventInserted){
                  // insert first record , first record is always a recurring shift
                  factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                  firstEventInserted = true;
                }
                else{
                  followingEvent.recurrence = factory.recurrences[0];
                }
                
                /* check to make sure that date is exist , ie 31th , not all month have 31th */
                if(newStartDate.getDate().toString() === sourceEvent.rruleObject.byMonthDay[i].toString())
                  followingEvents.push(followingEvent); 
              }                 
            }
            
            startsAt.setMonth(startsAt.getMonth() + 1);
            endsAt.setMonth(endsAt.getMonth() + 1);
          }
        }
        else if(sourceEvent.rruleObject.byDay !== undefined && sourceEvent.rruleObject.byDay !== null){
          sourceEvent.rruleObject.byDay = sourceEvent.rruleObject.byDay.toString();
          preffix = parseInt(sourceEvent.rruleObject.byDay.substr(0,1));
          day = sourceEvent.rruleObject.byDay.substr(1,2);
          firstDateOfMonth = new Date(startsAt);
          firstDateOfMonth.setDate(1);
          if(firstDateOfMonth < startsAt)
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + 1);
          
          while(startsAt.getFullYear() <= currentYear){
            
            dayIndex = factory.getDayIndexOfWeek(day);
            dayAdd = factory.findNextDayOfWeek(firstDateOfMonth,dayIndex);
            
            newStartDate = new Date(startsAt);
            newStartDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newStartDate.setMonth(firstDateOfMonth.getMonth());
            newEndDate = new Date(endsAt);
            newEndDate.setDate(firstDateOfMonth.getDate() + dayAdd + ((preffix - 1) * 7));
            newEndDate.setMonth(firstDateOfMonth.getMonth());
            
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,newStartDate);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,newStartDate,newEndDate); 
              
              if(!firstEventInserted){
                // insert first record , first record is always a recurring shift
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
              
              followingEvents.push(followingEvent);
            }
            
            firstDateOfMonth.setMonth(firstDateOfMonth.getMonth() + sourceEvent.rruleObject.interval);
            
            startsAt.setMonth(startsAt.getMonth() + 1);
            endsAt.setMonth(endsAt.getMonth() + 1);
          }
        }
      }
      
    }
    return followingEvents;
  };
  
  factory.insertYearlyRecurrenceEvents = function(sourceEvent,dataSource,yearOfCalendar,yearAmountToInsert){
    var followingEvents = [];
    var followingEvent = null;  
    
    /* because now everytime assign data to calendar , calendar will move to current date
     * so solution is inserting to 100 years later to avoid calendar reload.
     * It is just temporary solution until now
     * 
     * */      
    
    if(sourceEvent.rruleObject.freq === factory.frequency[3]){
      var startsAt = null;
      var endsAt = null;          
      var i = 0,j = 0;
      var currentDate = new Date();
      var endDate = null;
      var firstEventInserted = false;
      var replaceShift = null;
      var currentYear = yearOfCalendar;
      currentYear = currentYear + yearAmountToInsert;
      sourceEvent.rruleObject.interval = parseInt(sourceEvent.rruleObject.interval);
      sourceEvent.rruleObject.byMonth = parseInt(sourceEvent.rruleObject.byMonth);
      
      if(startsAt === null)
        startsAt = new Date(sourceEvent.startDate);
      if(endsAt === null)
        endsAt = new Date(sourceEvent.endDate);
              
      startsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
      endsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
      
      // insert repeat to a date
      if(sourceEvent.rruleObject.until !== undefined && sourceEvent.rruleObject.until !== null){
        sourceEvent.rruleObject.byMonth = parseInt(sourceEvent.rruleObject.byMonth);
        var yyyyMMDD = sourceEvent.rruleObject.until.substring(0,8);
        endDate = moment(yyyyMMDD,'YYYYMMDD').add(24,'hours');
        
        startsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
        endsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
                  
        if(startsAt.getFullYear() === currentDate.getFullYear() && startsAt.getDate() < currentDate.getDate()){
          startsAt.setFullYear(startsAt.getFullYear() + 1);
          endsAt.setFullYear(endsAt.getFullYear() + 1);
        }    
        
        while(startsAt < endDate){
            
          for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,new Date(startsAt),new Date(endsAt));

              
              if(!firstEventInserted){
                // insert first record , first record is always a recurring shift
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
                            
              followingEvents.push(followingEvent);
            }
          }
                                  
          startsAt.setFullYear(startsAt.getFullYear() + sourceEvent.rruleObject.interval);
          endsAt.setFullYear(endsAt.getFullYear() + sourceEvent.rruleObject.interval);
        }
      }
      // insert repeat by number
      else if(sourceEvent.rruleObject.count !== undefined && sourceEvent.rruleObject.count !== null){
        var t = 1;
        var count = parseInt(sourceEvent.rruleObject.count);
        sourceEvent.rruleObject.byMonth = parseInt(sourceEvent.rruleObject.byMonth);
        //        startsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
        //        endsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
        //                  
        //        if(startsAt < currentDate){
        //          startsAt.setFullYear(startsAt.getFullYear() + 1);
        //          endsAt.setFullYear(endsAt.getFullYear() + 1);
        //        }
        
        while(t <= count){
          startsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
          endsAt.setMonth(sourceEvent.rruleObject.byMonth - 1);
                    
          for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
            startsAt.setDate(sourceEvent.rruleObject.byMonthDay[i]);
            endsAt.setDate(sourceEvent.rruleObject.byMonthDay[i]);
            
            if(startsAt.getFullYear() === currentDate.getFullYear() && startsAt.getDate() < currentDate.getDate()){
              startsAt.setFullYear(startsAt.getFullYear() + 1);
              endsAt.setFullYear(endsAt.getFullYear() + 1);
            }  
            
            replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
            if(replaceShift === null){
              followingEvent = factory.createFollowingEvent(sourceEvent,new Date(startsAt),new Date(endsAt)); 
                
              if(!firstEventInserted){
                // insert first record , first record is always a recurring shift
                factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                firstEventInserted = true;
              }
              else{
                followingEvent.recurrence = factory.recurrences[0];
              }
                            
              followingEvents.push(followingEvent);  
            }   
          }                       
          
          startsAt.setFullYear(startsAt.getFullYear() + sourceEvent.rruleObject.interval);
          endsAt.setFullYear(endsAt.getFullYear() + sourceEvent.rruleObject.interval);
          
          t++;
        }
      }
      // insert repeat 
      else{
        
        if(yearAmountToInsert === -1){

          while(true){

            if(startsAt.getFullYear() === yearOfCalendar){
              
              for(i=0;i<sourceEvent.rruleObject.byMonthDay.length;i++){
                replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
                if(replaceShift === null){
                  followingEvent = factory.createFollowingEvent(sourceEvent,new Date(startsAt),new Date(endsAt)); 
                    
                  if(!firstEventInserted){
                    // insert first record , first record is always a recurring shift
                    factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);

                    firstEventInserted = true;
                  }
                  else{
                    followingEvent.recurrence = factory.recurrences[0];
                  }
                  
                  followingEvents.push(followingEvent);  
                }
              }                        
            }
            else if(startsAt.getFullYear() > yearOfCalendar)
              break;

            startsAt.setFullYear(startsAt.getFullYear() + sourceEvent.rruleObject.interval);
            endsAt.setFullYear(endsAt.getFullYear() + sourceEvent.rruleObject.interval);
          }
        }
        else{
          for(i=startsAt.getFullYear();i<currentYear;i++){
                        
            for(j=0;j<sourceEvent.rruleObject.byMonthDay.length;j++){
              replaceShift = factory.findReplaceShift(dataSource,sourceEvent,startsAt);
              if(replaceShift === null){
                followingEvent = factory.createFollowingEvent(sourceEvent,new Date(startsAt),new Date(endsAt)); 
                 
                if(!firstEventInserted){
                  // insert first record , first record is always a recurring shift
                  factory.convertFollowingEventToRootEvent(sourceEvent,followingEvent);
                  firstEventInserted = true;
                }
                else{
                  followingEvent.recurrence = factory.recurrences[0];
                }
                
                followingEvents.push(followingEvent);  
              }
            }            
                      
            startsAt.setFullYear(startsAt.getFullYear() + sourceEvent.rruleObject.interval);
            endsAt.setFullYear(endsAt.getFullYear() + sourceEvent.rruleObject.interval);
          }
        }
        
      }
    }
    return followingEvents;
  };
  
  factory.buildEvents = function(dataSource,year,insertToYear){
    var followingEvents = null;
    var events = [];

    for(var i=0;i<dataSource.length;i++){
      if(dataSource[i].rruleObject !== undefined && (dataSource[i].isDisplay === undefined || dataSource[i].isDisplay !== 'no')){              

        // generate following events for daily recurrence event
        followingEvents = factory.insertDailyRecurrenceEvents(dataSource[i],dataSource,year,10);
        events = events.concat(followingEvents);
        
        // generate following events for weekly recurrence event              
        followingEvents = factory.insertWeeklyRecurrenceEvents(dataSource[i],dataSource,year,10);              
        events = events.concat(followingEvents);
        
        // generate following events for monthly recurrence event
        followingEvents = factory.insertMonthlyRecurrenceEvents(dataSource[i],dataSource,year,10);              
        events = events.concat(followingEvents);
        
        // generate following events for yearly recurrence event
        followingEvents = factory.insertYearlyRecurrenceEvents(dataSource[i],dataSource,year,10);              
        events = events.concat(followingEvents);
      }
      else{
        // insert one time event
        if(dataSource[i].isDisplay !== 'no'){
          events.push(dataSource[i]);  
        }        
      }
    }      
    
    return events;
  };
  
  /***
   * jsonObj type : 
   * {
   *   recurrence,
   *    
   * }
   */
  factory.buildRRuleString = function(jsonObj){
    var objInput = angular.copy(jsonObj);
    
    var rrule = '';
    var byDayArr = [];
    var byMonthDayArr = [];
    var i = 0;
    var j = 0;
    if(objInput.recurrence === factory.recurrences[1] || objInput.recurrence === factory.recurrences[2] || objInput.recurrence === factory.recurrences[3] || objInput.recurrence === factory.recurrences[4]){
      if(objInput.recurrence === factory.recurrences[1]){
        rrule = 'FREQ=DAILY;';
      }
      
      // week
      if(objInput.recurrence === factory.recurrences[2]){
        rrule = 'FREQ=WEEKLY;';
          
        // bydate
        for(i=0;i<objInput.frequencyWeek.activeDay.length;i++){
          if(objInput.frequencyWeek.activeDay[i]){
            byDayArr.push(factory.dayOfWeek[i].value);
          }
        }
        rrule += 'BYDAY=' + byDayArr.toString() + ';';
      }
      
      // month
      if(objInput.recurrence === factory.recurrences[3]){
        rrule = 'FREQ=MONTHLY;';
        
        if(objInput.frequencyMonth.dateOrDaySelected === 'date'){            
          byMonthDayArr = [];
          for(i = 0;i<objInput.frequencyMonth.selectedDate.length;i++){
            byMonthDayArr.push(objInput.frequencyMonth.selectedDate[i].getDate());
          }
          if(byMonthDayArr.length > 0){
            rrule += 'BYMONTHDAY=' + byMonthDayArr.toString() + ';';
          }
        }
        else{
          rrule += 'BYDAY=' + objInput.frequencyMonth.selectedDay.at + objInput.frequencyMonth.selectedDay.day + ';';
        }         
      }
      
      if(objInput.recurrence === factory.recurrences[4]){
        rrule = 'FREQ=YEARLY;';
      
        byMonthDayArr = [];
        for(i = 0;i<objInput.frequencyYear.selectedMonth.length;i++){
          for(j=0;j<factory.monthOfYear.length;j++){
            if(objInput.frequencyYear.selectedMonth[i] === factory.monthOfYear[j].name){
              byMonthDayArr.push(factory.monthOfYear[j].value);
              break;
            }  
          }
        }
        if(byMonthDayArr.length > 0){
          rrule += 'BYMONTH=' + byMonthDayArr.toString() + ';';
        }
        
        rrule += 'BYMONTHDAY=' + objInput.startDate.getDate() + ';';
        
        // when user choose month of year , user also have to choose a date of month
        //        if(objInput.frequencyMonth.dateOrDaySelected === 'date'){            
        //          byMonthDayArr = [];
        //          for(i = 0;i<objInput.frequencyMonth.selectedDate.length;i++){
        //            byMonthDayArr.push(objInput.frequencyMonth.selectedDate[i].getDate());
        //          }
        //          if(byMonthDayArr.length > 0){
        //            rrule += 'BYMONTHDAY=' + byMonthDayArr.toString() + ';';
        //          }
        //        }
        //        else{
        //          rrule += 'BYDAY=' + objInput.frequencyMonth.selectedDay.at + objInput.frequencyMonth.selectedDay.day + ';';
        //        }
      }
      
      //interval
      rrule += 'INTERVAL=' + objInput.every + ';';
      
      // on date
      if(objInput.ends === factory.endsValues[1]){
        var endsOnDate = moment(objInput.endsOnDate);
        rrule += 'UNTIL=' + endsOnDate.format('YYYYMMDD') + 'T000000Z' + ';';
      }
      // After # Occurrences
      if(objInput.ends === factory.endsValues[2]){
        rrule += 'COUNT=' + objInput.occurrences + ';';
      }
      return rrule;
    }
    return '';
  };
  
  factory.parseRRule = function(rruleString){
    if(rruleString !== undefined && rruleString !== null && rruleString !== ''){
      var rruleObject = {};
      var rruleArr = rruleString.split(';');
      
      for(var i=0;i<rruleArr.length;i++){        
        // get FREQ
        if(rruleObject.freq === undefined){
          if(rruleArr[i].indexOf('FREQ') > -1){
            var freqArr = rruleArr[i].split('=');
            rruleObject.freq = freqArr[1];
          }  
        }
        
        // get INTERVAL
        if(rruleObject.interval === undefined){
          if(rruleArr[i].indexOf('INTERVAL') > -1){
            var intervalArr = rruleArr[i].split('=');
            rruleObject.interval = intervalArr[1];
          }  
        }        
        
        // get BYDAY
        if(rruleObject.byDay === undefined){
          if(rruleArr[i].indexOf('BYDAY') > -1){
            var byDayArr = rruleArr[i].split('=');
            byDayArr = byDayArr[1].split(',');
            rruleObject.byDay = byDayArr;
          }          
        }
        
        // get BYMONTHDAY
        if(rruleObject.byMonthDay === undefined){
          if(rruleArr[i].indexOf('BYMONTHDAY') > -1){
            var byMonthDayArr = rruleArr[i].split('=');
            byMonthDayArr = byMonthDayArr[1].split(',');
            rruleObject.byMonthDay = byMonthDayArr;
          }          
        }
        
        // get BYMONTH
        if(rruleObject.byMonth === undefined){
          if(rruleArr[i].indexOf('BYMONTH') > -1){
            var byMonthArr = rruleArr[i].split('=');
            byMonthArr = byMonthArr[1].split(',');
            rruleObject.byMonth = byMonthArr;
          }
        }
        
        // get UNTIL
        if(rruleObject.until === undefined){
          if(rruleArr[i].indexOf('UNTIL') > -1){
            var untilArr = rruleArr[i].split('=');
            rruleObject.until = untilArr[1];
          }
        }
        
        // get COUNT
        if(rruleObject.count === undefined){
          if(rruleArr[i].indexOf('COUNT') > -1){
            var countArr = rruleArr[i].split('=');
            rruleObject.count = countArr[1];
          }
        }
      }
      
      return rruleObject;
    } 
    return null;
  };
  
  factory.getDayIndexOfWeek = function(byDayCode){
    for(var i=0;i<factory.dayOfWeek.length;i++)
      if(byDayCode === factory.dayOfWeek[i].value)
        return i;
  };
  
  factory.findSundayOfWeek = function(fromDate){
    var newDate = new Date(fromDate);
    if(newDate.getDay() === 0)
      return newDate;
        
    newDate.setDate(newDate.getDate() - newDate.getDay());
    return newDate;
  };
  
  factory.findNextDayOfWeek = function(currentDate,dayIndexOfWeekToFind){
    var newDate = new Date(currentDate);
    for(var i=0;i<=6;i++){
      if(newDate.getDay() === dayIndexOfWeekToFind)
        return i;
      newDate.setDate(newDate.getDate() + 1);
    }
    return i;
  };
  

  factory.findNextDateOfMonth = function(currentDate,dateIndexOfMonthToFind){
    var newDate = new Date(currentDate);
    for(var i=0;i<=30;i++){
      if(newDate.getDate() === dateIndexOfMonthToFind)
        return i;
      newDate.setDate(newDate.getDate() + 1);
    }
    return i;
  };
  
  return factory;
}